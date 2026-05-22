// services/donationService.ts
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db } from '../firebase'
import { addFoodItem, markFoodAsDonated } from './foodService'
import { createNotification, NotificationType } from './notificationService'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ListingStatus = {
  ACTIVE: 'active',
  CLAIMED: 'claimed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type ListingStatusValue = (typeof ListingStatus)[keyof typeof ListingStatus]

export const RequestStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
} as const

export type RequestStatusValue = (typeof RequestStatus)[keyof typeof RequestStatus]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateDonationListingPayload {
  title: string
  description?: string | null
  quantity: number
  expiryDate: string
  pickupLocation: string
  availabilityStart: string
  availabilityEnd: string
}

export interface DonationListing extends CreateDonationListingPayload {
  id: string
  user_id: string
  food_id: string
  status: ListingStatusValue
  created_at: unknown // Firestore Timestamp
}

export interface DonationRequest {
  id: string
  claimer_user_id: string
  listing_id: string
  status: RequestStatusValue
  requested_at: unknown // Firestore Timestamp
  confirmed_at: unknown | null
}

const LISTING_COL = 'donationListings'
const REQUEST_COL = 'donationRequests'
const trimForRule = (value: string, maxLength: number) => value.trim().slice(0, maxLength)

// ─── Create Donation Listing ──────────────────────────────────────────────────

export async function createDonationListing(
  uid: string,
  foodId: string,
  payload: CreateDonationListingPayload,
): Promise<string> {
  const docRef = await addDoc(collection(db, LISTING_COL), {
    user_id: uid,
    food_id: foodId,
    title: payload.title,
    description: payload.description ?? null,
    quantity: payload.quantity,
    expiry_date: payload.expiryDate,
    pickup_location: payload.pickupLocation,
    availability_start: payload.availabilityStart,
    availability_end: payload.availabilityEnd,
    status: ListingStatus.ACTIVE,
    created_at: serverTimestamp(),
  })

  await markFoodAsDonated(foodId)

  return docRef.id
}

// ─── Get All Active Listings ──────────────────────────────────────────────────

export async function getActiveListings(): Promise<DonationListing[]> {
  const q = query(
    collection(db, LISTING_COL),
    where('status', '==', ListingStatus.ACTIVE),
    orderBy('expiry_date', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DonationListing)
}

// ─── Get User's Own Listings ──────────────────────────────────────────────────

export async function getUserListings(uid: string): Promise<DonationListing[]> {
  const q = query(collection(db, LISTING_COL), where('user_id', '==', uid))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as DonationListing)
    .sort((a, b) => toListingTimestamp(b.created_at) - toListingTimestamp(a.created_at))
}

function toListingTimestamp(value: unknown): number {
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().getTime()
  }
  const parsed = new Date(String(value)).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

// ─── Get Single Listing ───────────────────────────────────────────────────────

export async function getDonationListing(listingId: string): Promise<DonationListing> {
  const snap = await getDoc(doc(db, LISTING_COL, listingId))
  if (!snap.exists()) throw new Error('Listing not found')
  return { id: snap.id, ...snap.data() } as DonationListing
}

// ─── Update Listing ───────────────────────────────────────────────────────────

export async function updateDonationListing(
  listingId: string,
  updates: Partial<DonationListing>,
): Promise<void> {
  await updateDoc(doc(db, LISTING_COL, listingId), updates)
}

// ─── Cancel Listing ───────────────────────────────────────────────────────────

export async function cancelDonationListing(listingId: string): Promise<void> {
  await updateDoc(doc(db, LISTING_COL, listingId), { status: ListingStatus.CANCELLED })
}

// ─── Claim a Donation ─────────────────────────────────────────────────────────

export async function claimDonation(claimerUid: string, listingId: string): Promise<string> {
  const listing = await getDonationListing(listingId)
  const listingData = listing as unknown as Record<string, unknown>
  const expiryDate =
    typeof listingData['expiry_date'] === 'string'
      ? listingData['expiry_date']
      : listing.expiryDate
  const pickupLocation =
    typeof listingData['pickup_location'] === 'string'
      ? listingData['pickup_location']
      : listing.pickupLocation

  const reqRef = await addDoc(collection(db, REQUEST_COL), {
    claimer_user_id: claimerUid,
    listing_id: listingId,
    status: RequestStatus.PENDING,
    requested_at: serverTimestamp(),
    confirmed_at: null,
  })

  // Set the listing status to claimed and add claimer to claimed_by_uids
  // This allows the claimer to read the listing even after it's completed/cancelled
  await updateDoc(doc(db, LISTING_COL, listingId), {
    status: ListingStatus.CLAIMED,
    claimed_by_uids: arrayUnion(claimerUid),
  })

  await addFoodItem(claimerUid, {
    name: trimForRule(listing.title, 80),
    quantity: listing.quantity,
    unit: 'unit',
    expiryDate,
    foodType: 'Donation',
    type: 'pantry',
    storageLocation: trimForRule(pickupLocation || 'Claimed donation', 80),
    notes: trimForRule(listing.description ?? `Claimed from donation listing ${listingId}`, 500),
  })

  await createNotification(listing.user_id, {
    type: NotificationType.DONATION_CLAIMED,
    message: `Your listing "${listing.title}" has been requested.`,
    relatedEntityId: listingId,
  })

  return reqRef.id
}

// ─── Confirm Donation Request ─────────────────────────────────────────────────

export async function confirmDonationRequest(requestId: string, listingId: string): Promise<void> {
  await updateDoc(doc(db, REQUEST_COL, requestId), {
    status: RequestStatus.CONFIRMED,
    confirmed_at: serverTimestamp(),
  })
  await updateDoc(doc(db, LISTING_COL, listingId), { status: ListingStatus.CLAIMED })
}

// ─── Reject Donation Request ──────────────────────────────────────────────────

export async function rejectDonationRequest(requestId: string): Promise<void> {
  const reqSnap = await getDoc(doc(db, REQUEST_COL, requestId))
  if (reqSnap.exists()) {
    const reqData = reqSnap.data()
    const listingId = reqData.listing_id
    await updateDoc(doc(db, REQUEST_COL, requestId), { status: RequestStatus.REJECTED })
    await updateDoc(doc(db, LISTING_COL, listingId), { status: ListingStatus.ACTIVE })
  }
}

// ─── Get Requests for a Listing ───────────────────────────────────────────────

export async function getRequestsForListing(listingId: string): Promise<DonationRequest[]> {
  const q = query(
    collection(db, REQUEST_COL),
    where('listing_id', '==', listingId),
    orderBy('requested_at', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DonationRequest)
}

// ─── Get Requests Made by User ────────────────────────────────────────────────

export async function getUserDonationRequests(uid: string): Promise<DonationRequest[]> {
  const q = query(
    collection(db, REQUEST_COL),
    where('claimer_user_id', '==', uid),
    orderBy('requested_at', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DonationRequest)
}
