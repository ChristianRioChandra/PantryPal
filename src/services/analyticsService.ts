// services/analyticsService.ts
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  FoodStatus,
  FoodActionKind,
  getFoodActions,
  getUserFoodItems,
  type FoodItem,
} from './foodService'
import { getUserListings, ListingStatus, type DonationListing } from './donationService'
import { getCategories, type Category } from './categoryService'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FoodSavedStats {
  totalItemsSaved: number
  totalQuantitySaved: number
}

export interface DonationStats {
  totalDonationsPosted: number
  totalDonationsClaimed: number
}

export interface WasteAvoidedStats {
  totalWasteAvoided: number
  breakdown: {
    used: number
    donated: number
  }
}

export interface MonthlyBreakdownEntry {
  month: string   // e.g. 'Jan 2026'
  saved: number
  donated: number
}

export interface CategoryBreakdownEntry {
  category: string
  count: number
}

export interface FullAnalytics {
  foodSaved: FoodSavedStats
  donationStats: DonationStats
  wasteAvoided: WasteAvoidedStats
  monthlyBreakdown: MonthlyBreakdownEntry[]
  categoryBreakdown: CategoryBreakdownEntry[]
}

export type AnalyticsEventKind = 'used' | 'donated'

export interface UserAnalyticsEvent {
  id: string
  kind: AnalyticsEventKind
  name: string
  category: string
  foodType: string
  quantity: number
  unit: string
  date: Date
}

function parseFirestoreDate(value: unknown): Date | null {
  if (!value) return null

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate()
  }

  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getNumericValue(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeCategoryKey(category: string): string {
  const normalized = category.trim().toLowerCase().replace(/\s+/g, '-')
  return normalized || 'uncategorized'
}

function resolveCategoryLabel(
  rawCategory: string,
  categoryNameById: Map<string, string>,
): string {
  const trimmed = rawCategory.trim()
  if (!trimmed) return 'uncategorized'

  const fromCatalog = categoryNameById.get(trimmed)
  if (fromCatalog) return normalizeCategoryKey(fromCatalog)

  return normalizeCategoryKey(trimmed)
}

function buildCategoryLookup(categories: Category[]): Map<string, string> {
  const lookup = new Map<string, string>()
  categories.forEach((category) => {
    lookup.set(category.id, category.name)
    lookup.set(normalizeCategoryKey(category.name), category.name)
  })
  return lookup
}

function mapFoodItemToUsedEvent(
  item: FoodItem,
  categoryNameById: Map<string, string>,
): UserAnalyticsEvent | null {
  if (item.status !== FoodStatus.USED) return null

  const record = item as FoodItem & Record<string, unknown>
  const category = resolveCategoryLabel(
    String(record.category ?? record.type ?? record.foodType ?? 'uncategorized'),
    categoryNameById,
  )

  return {
    id: `food_${item.id}`,
    kind: 'used',
    name: item.name,
    category,
    foodType: String(record.food_type ?? record.foodType ?? 'Food'),
    quantity: getNumericValue(record.quantity, 1),
    unit: String(record.unit ?? 'item'),
    date: parseFirestoreDate(record.updated_at) ?? parseFirestoreDate(record.created_at) ?? new Date(),
  }
}

function mapListingToDonatedEvent(
  listing: DonationListing,
  foodById: Map<string, FoodItem>,
  categoryNameById: Map<string, string>,
): UserAnalyticsEvent {
  const record = listing as DonationListing & Record<string, unknown>
  const linkedFood = foodById.get(listing.food_id)
  const linkedRecord = linkedFood as (FoodItem & Record<string, unknown>) | undefined
  const category = linkedRecord
    ? resolveCategoryLabel(
        String(linkedRecord.category ?? linkedRecord.type ?? linkedFood?.foodType ?? 'donations'),
        categoryNameById,
      )
    : 'donations'

  return {
    id: `listing_${listing.id}`,
    kind: 'donated',
    name: listing.title,
    category,
    foodType: linkedFood
      ? String(linkedRecord?.food_type ?? linkedRecord?.foodType ?? 'Food')
      : 'Donation',
    quantity: getNumericValue(record.quantity, 1),
    unit: 'item',
    date: parseFirestoreDate(record.created_at) ?? new Date(),
  }
}

export interface PantrySnapshot {
  totalItems: number
  expiringSoon: number
}

export async function fetchPantrySnapshot(uid: string): Promise<PantrySnapshot> {
  const foodItems = await getUserFoodItems(uid).catch(() => [] as FoodItem[])
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const activeItems = foodItems.filter(
    (item) => item.status === FoodStatus.AVAILABLE || item.status === FoodStatus.PLANNED,
  )

  const expiringSoon = activeItems.filter((item) => {
    const record = item as FoodItem & Record<string, unknown>
    const expiry = parseFirestoreDate(record.expiry_date ?? record.expiryDate)
    if (!expiry) return false
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / 86400000)
    return diffDays <= 3 && diffDays >= 0
  }).length

  return {
    totalItems: activeItems.length,
    expiringSoon,
  }
}

/** Build timeline events from Firestore food_actions, food, and donation listings. */
export async function fetchUserAnalyticsEvents(uid: string): Promise<UserAnalyticsEvent[]> {
  const [actions, foodItems, listings, categories] = await Promise.all([
    getFoodActions(uid),
    getUserFoodItems(uid),
    getUserListings(uid),
    getCategories(),
  ])

  const categoryNameById = buildCategoryLookup(categories)
  const foodById = new Map(foodItems.map((item) => [item.id, item]))
  const events: UserAnalyticsEvent[] = []
  const usedFoodIds = new Set<string>()

  actions.forEach((action) => {
    if (action.kind !== FoodActionKind.FINISHED) return

    events.push({
      id: `action_${action.id}`,
      kind: 'used',
      name: action.name,
      category: resolveCategoryLabel(action.category, categoryNameById),
      foodType: action.food_type,
      quantity: action.quantity,
      unit: action.unit,
      date: parseFirestoreDate(action.actioned_at) ?? new Date(),
    })
    usedFoodIds.add(action.food_id)
  })

  foodItems.forEach((item) => {
    if (usedFoodIds.has(item.id)) return
    const usedEvent = mapFoodItemToUsedEvent(item, categoryNameById)
    if (usedEvent) events.push(usedEvent)
  })

  listings.forEach((listing) => {
    events.push(mapListingToDonatedEvent(listing, foodById, categoryNameById))
  })

  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}

// ─── Food Saved Stats ─────────────────────────────────────────────────────────

export async function getFoodSavedStats(uid: string): Promise<FoodSavedStats> {
  const q = query(
    collection(db, 'food'),
    where('user_id', '==', uid),
    where('status', '==', FoodStatus.USED)
  )
  const snap = await getDocs(q)
  const items = snap.docs.map(d => d.data())

  return {
    totalItemsSaved: items.length,
    totalQuantitySaved: items.reduce((sum, item) => sum + (item['quantity'] ?? 0), 0),
  }
}

// ─── Donation Stats ───────────────────────────────────────────────────────────

export async function getDonationStats(uid: string): Promise<DonationStats> {
  const q = query(
    collection(db, 'donationListings'),
    where('user_id', '==', uid)
  )
  const snap = await getDocs(q)
  const allListings = snap.docs.map(d => d.data())

  const claimed = allListings.filter(
    l => l['status'] === ListingStatus.CLAIMED || l['status'] === ListingStatus.COMPLETED
  )

  return {
    totalDonationsPosted: allListings.length,
    totalDonationsClaimed: claimed.length,
  }
}

// ─── Waste Avoided Stats ──────────────────────────────────────────────────────

export async function getWasteAvoidedStats(uid: string): Promise<WasteAvoidedStats> {
  const q = query(collection(db, 'food'), where('user_id', '==', uid))
  const snap = await getDocs(q)
  const items = snap.docs.map(d => d.data())

  const wasteAvoided = items.filter(
    item => item['status'] === FoodStatus.USED || item['status'] === FoodStatus.DONATED
  )

  return {
    totalWasteAvoided: wasteAvoided.length,
    breakdown: {
      used: wasteAvoided.filter(i => i['status'] === FoodStatus.USED).length,
      donated: wasteAvoided.filter(i => i['status'] === FoodStatus.DONATED).length,
    },
  }
}

// ─── Wasted Stats (from food_actions collection) ───────────────────────────────

export interface WastedItemStats {
  totalWasted: number
  totalFinished: number
  wasteRate: number // 0-1 ratio of wasted to total actions
}

export async function getWastedItemStats(uid: string): Promise<WastedItemStats> {
  const q = query(
    collection(db, 'food_actions'),
    where('user_id', '==', uid),
  )
  const snap = await getDocs(q)
  const actions = snap.docs.map(d => d.data())

  const totalWasted = actions.filter(a => a['kind'] === FoodActionKind.WASTED).length
  const totalFinished = actions.filter(a => a['kind'] === FoodActionKind.FINISHED).length
  const total = totalWasted + totalFinished
  const wasteRate = total === 0 ? 0 : totalWasted / total

  return { totalWasted, totalFinished, wasteRate }
}

// ─── Monthly Breakdown ────────────────────────────────────────────────────────

export async function getMonthlyBreakdown(uid: string): Promise<MonthlyBreakdownEntry[]> {
  const q = query(
    collection(db, 'food'),
    where('user_id', '==', uid),
    orderBy('created_at', 'asc')
  )
  const snap = await getDocs(q)
  const items = snap.docs.map(d => d.data())

  const monthMap: Record<string, MonthlyBreakdownEntry> = {}

  items.forEach(item => {
    if (!item['created_at']) return
    const date = item['created_at'].toDate
      ? item['created_at'].toDate()
      : new Date(item['created_at'])
    const key = date.toLocaleString('default', { month: 'short', year: 'numeric' })

    if (!monthMap[key]) monthMap[key] = { month: key, saved: 0, donated: 0 }
    if (item['status'] === FoodStatus.USED) monthMap[key].saved++
    if (item['status'] === FoodStatus.DONATED) monthMap[key].donated++
  })

  return Object.values(monthMap)
}

// ─── Category Breakdown ───────────────────────────────────────────────────────

export async function getCategoryBreakdown(uid: string): Promise<CategoryBreakdownEntry[]> {
  const q = query(collection(db, 'food'), where('user_id', '==', uid))
  const snap = await getDocs(q)
  const items = snap.docs.map(d => d.data())

  const categoryMap: Record<string, number> = {}
  items.forEach(item => {
    const cat: string = item['category_id'] ?? 'Uncategorized'
    categoryMap[cat] = (categoryMap[cat] ?? 0) + 1
  })

  return Object.entries(categoryMap).map(([category, count]) => ({ category, count }))
}

// ─── Full Analytics ───────────────────────────────────────────────────────────

export async function getFullAnalytics(uid: string): Promise<FullAnalytics> {
  const [foodSaved, donationStats, wasteAvoided, monthlyBreakdown, categoryBreakdown] =
    await Promise.all([
      getFoodSavedStats(uid),
      getDonationStats(uid),
      getWasteAvoidedStats(uid),
      getMonthlyBreakdown(uid),
      getCategoryBreakdown(uid),
    ])

  return { foodSaved, donationStats, wasteAvoided, monthlyBreakdown, categoryBreakdown }
}
