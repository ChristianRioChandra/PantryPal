// services/analyticsService.js
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'
import { FoodStatus } from './foodService'
import { ListingStatus } from './donationService'

// ─── Get Food Saved Summary ───────────────────────────────────────────────────

/**
 * Returns total count and quantity of food items marked as 'used'.
 */
export async function getFoodSavedStats(uid) {
  const q = query(
    collection(db, 'food'),
    where('user_id', '==', uid),
    where('status', '==', FoodStatus.USED)
  )
  const snap = await getDocs(q)
  const items = snap.docs.map(d => d.data())

  return {
    totalItemsSaved: items.length,
    totalQuantitySaved: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
  }
}

// ─── Get Donation Stats ───────────────────────────────────────────────────────

/**
 * Returns total donations made and claimed.
 */
export async function getDonationStats(uid) {
  const allQ = query(
    collection(db, 'donationListings'),
    where('user_id', '==', uid)
  )
  const allSnap = await getDocs(allQ)
  const allListings = allSnap.docs.map(d => d.data())

  const claimed = allListings.filter(l => l.status === ListingStatus.CLAIMED || l.status === ListingStatus.COMPLETED)

  return {
    totalDonationsPosted: allListings.length,
    totalDonationsClaimed: claimed.length,
  }
}

// ─── Get Waste Avoided Stats ──────────────────────────────────────────────────

/**
 * Items that were used OR donated = waste avoided.
 */
export async function getWasteAvoidedStats(uid) {
  const q = query(
    collection(db, 'food'),
    where('user_id', '==', uid)
  )
  const snap = await getDocs(q)
  const items = snap.docs.map(d => d.data())

  const wasteAvoided = items.filter(
    item => item.status === FoodStatus.USED || item.status === FoodStatus.DONATED
  )

  return {
    totalWasteAvoided: wasteAvoided.length,
    breakdown: {
      used: wasteAvoided.filter(i => i.status === FoodStatus.USED).length,
      donated: wasteAvoided.filter(i => i.status === FoodStatus.DONATED).length,
    }
  }
}

// ─── Get Monthly Breakdown ────────────────────────────────────────────────────

/**
 * Groups food items by month for chart display.
 * Returns array of { month: 'Jan 2025', saved: N, donated: N }
 */
export async function getMonthlyBreakdown(uid) {
  const q = query(
    collection(db, 'food'),
    where('user_id', '==', uid),
    orderBy('created_at', 'asc')
  )
  const snap = await getDocs(q)
  const items = snap.docs.map(d => d.data())

  const monthMap = {}

  items.forEach(item => {
    if (!item.created_at) return
    const date = item.created_at.toDate ? item.created_at.toDate() : new Date(item.created_at)
    const key = date.toLocaleString('default', { month: 'short', year: 'numeric' })

    if (!monthMap[key]) monthMap[key] = { month: key, saved: 0, donated: 0 }

    if (item.status === FoodStatus.USED) monthMap[key].saved++
    if (item.status === FoodStatus.DONATED) monthMap[key].donated++
  })

  return Object.values(monthMap)
}

// ─── Get Category Breakdown ───────────────────────────────────────────────────

/**
 * Groups food items by category for pie/donut chart.
 */
export async function getCategoryBreakdown(uid) {
  const q = query(
    collection(db, 'food'),
    where('user_id', '==', uid)
  )
  const snap = await getDocs(q)
  const items = snap.docs.map(d => d.data())

  const categoryMap = {}
  items.forEach(item => {
    const cat = item.category_id || 'Uncategorized'
    if (!categoryMap[cat]) categoryMap[cat] = 0
    categoryMap[cat]++
  })

  return Object.entries(categoryMap).map(([category, count]) => ({ category, count }))
}

// ─── Get Full Analytics Summary ───────────────────────────────────────────────

/**
 * Single call to get all analytics data for the dashboard.
 */
export async function getFullAnalytics(uid) {
  const [foodSaved, donationStats, wasteAvoided, monthlyBreakdown, categoryBreakdown] = await Promise.all([
    getFoodSavedStats(uid),
    getDonationStats(uid),
    getWasteAvoidedStats(uid),
    getMonthlyBreakdown(uid),
    getCategoryBreakdown(uid),
  ])

  return {
    foodSaved,
    donationStats,
    wasteAvoided,
    monthlyBreakdown,
    categoryBreakdown,
  }
}
