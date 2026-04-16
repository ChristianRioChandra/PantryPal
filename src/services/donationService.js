// services/donationService.js
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { markFoodAsDonated } from './foodService'
import { createNotification, NotificationType } from './notificationService'

const LISTING_COL = 'donationListings'
const REQUEST_COL = 'donationRequests'

// ─── Listing Status Enum ──────────────────────────────────────────────────────
export const ListingStatus = {
  ACTIVE: 'active',
  CLAIMED: 'claimed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

// ─── Request Status Enum ──────────────────────────────────────────────────────
export const RequestStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
}

// ─── Create Donation Listing ─────────────────────────────────────────────────

/**
 * Convert a food item into a donation listing.
 */
export async function createDonationListing(uid, foodId, {
  title,
  description,
  quantity,
  expiryDate,
  pickupLocation,
  availabilityStart,
  availabilityEnd,
}) {
  const docRef = await addDoc(collection(db, LISTING_COL), {
    user_id: uid,
    food_id: foodId,
    title,
    description: description || null,
    quantity,
    expiry_date: expiryDate,
    pickup_location: pickupLocation,
    availability_start: availabilityStart,
    availability_end: availabilityEnd,
    status: ListingStatus.ACTIVE,
    created_at: serverTimestamp(),
  })

  // Update food item status to donated
  await markFoodAsDonated(foodId)

  return docRef.id
}

// ─── Get All Active Listings (Browse) ────────────────────────────────────────

export async function getActiveListings() {
  const q = query(
    collection(db, LISTING_COL),
    where('status', '==', ListingStatus.ACTIVE),
    orderBy('expiry_date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Get User's Own Listings ──────────────────────────────────────────────────

export async function getUserListings(uid) {
  const q = query(
    collection(db, LISTING_COL),
    where('user_id', '==', uid),
    orderBy('created_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Get Single Listing ───────────────────────────────────────────────────────

export async function getDonationListing(listingId) {
  const snap = await getDoc(doc(db, LISTING_COL, listingId))
  if (!snap.exists()) throw new Error('Listing not found')
  return { id: snap.id, ...snap.data() }
}

// ─── Update Listing ───────────────────────────────────────────────────────────

export async function updateDonationListing(listingId, updates) {
  await updateDoc(doc(db, LISTING_COL, listingId), updates)
}

// ─── Delete / Cancel Listing ──────────────────────────────────────────────────

export async function cancelDonationListing(listingId) {
  await updateDoc(doc(db, LISTING_COL, listingId), {
    status: ListingStatus.CANCELLED,
  })
}

// ─── Request / Claim a Donation ───────────────────────────────────────────────

/**
 * A user claims a donation listing.
 * Creates a DonationRequest and notifies the listing owner.
 */
export async function claimDonation(claimerUid, listingId) {
  const listing = await getDonationListing(listingId)

  const reqRef = await addDoc(collection(db, REQUEST_COL), {
    claimer_user_id: claimerUid,
    listing_id: listingId,
    status: RequestStatus.PENDING,
    requested_at: serverTimestamp(),
    confirmed_at: null,
  })

  // Notify the donor
  await createNotification(listing.user_id, {
    type: NotificationType.DONATION_CLAIMED,
    message: `Your listing "${listing.title}" has been requested.`,
    related_entity_id: listingId,
  })

  return reqRef.id
}

// ─── Confirm Donation Request ─────────────────────────────────────────────────

export async function confirmDonationRequest(requestId, listingId) {
  await updateDoc(doc(db, REQUEST_COL, requestId), {
    status: RequestStatus.CONFIRMED,
    confirmed_at: serverTimestamp(),
  })

  await updateDoc(doc(db, LISTING_COL, listingId), {
    status: ListingStatus.CLAIMED,
  })
}

// ─── Reject Donation Request ──────────────────────────────────────────────────

export async function rejectDonationRequest(requestId) {
  await updateDoc(doc(db, REQUEST_COL, requestId), {
    status: RequestStatus.REJECTED,
  })
}

// ─── Get Requests for a Listing ───────────────────────────────────────────────

export async function getRequestsForListing(listingId) {
  const q = query(
    collection(db, REQUEST_COL),
    where('listing_id', '==', listingId),
    orderBy('requested_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Get Requests Made by a User ─────────────────────────────────────────────

export async function getUserDonationRequests(uid) {
  const q = query(
    collection(db, REQUEST_COL),
    where('claimer_user_id', '==', uid),
    orderBy('requested_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
