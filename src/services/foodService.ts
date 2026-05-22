
// services/foodService.ts
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


// ─── Enums ────────────────────────────────────────────────────────────────────

export const FoodStatus = {
  AVAILABLE: 'available',
  USED: 'used',
  DONATED: 'donated',
  PLANNED: 'planned',
} as const

export type FoodStatusType = (typeof FoodStatus)[keyof typeof FoodStatus]

export const FoodType = {
  FRIDGE: 'fridge',
  PANTRY: 'pantry',
  FREEZER: 'freezer',
  COUNTERTOP: 'countertop',
} as const

export type FoodTypeValue = (typeof FoodType)[keyof typeof FoodType]

export const QuantityLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  FULL: 'full',
} as const

export type QuantityLevelValue = (typeof QuantityLevel)[keyof typeof QuantityLevel]

export const FoodActionKind = {
  FINISHED: 'finished',
  WASTED: 'wasted',
} as const

export type FoodActionKindValue = (typeof FoodActionKind)[keyof typeof FoodActionKind]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddFoodItemPayload {
  name: string
  quantity: number
  unit: string
  expiryDate: string        // ISO date string e.g. '2026-04-20'
  foodType: string
  type: FoodTypeValue
  storageLocation?: string | null
  notes?: string | null
}

export interface FoodItem extends AddFoodItemPayload {
  id: string
  user_id: string
  status: FoodStatusType
  quantity_level: QuantityLevelValue
  reserved_quantity?: number
  created_at: unknown       // Firestore Timestamp
}

export interface LogFoodActionPayload {
  food_id: string
  name: string
  category: string
  food_type: string
  quantity: number
  unit: string
  expiry_date: string
  was_expired: boolean
  kind: FoodActionKindValue
}

export interface FoodAction extends LogFoodActionPayload {
  id: string
  user_id: string
  actioned_at: unknown // Firestore Timestamp
}

const FOOD_COL = 'food'
const FOOD_ACTIONS_COL = 'food_actions'

// ─── Add Food Item ────────────────────────────────────────────────────────────

export async function addFoodItem(
  uid: string,
  payload: AddFoodItemPayload
): Promise<string> {
  const docRef = await addDoc(collection(db, FOOD_COL), {
    user_id: uid,
    food_type: payload.foodType,
    name: payload.name,
    quantity: payload.quantity,
    unit: payload.unit,
    expiry_date: payload.expiryDate,
    type: payload.type,
    storage_location: payload.storageLocation ?? null,
    notes: payload.notes ?? null,
    status: FoodStatus.AVAILABLE,
    quantity_level: QuantityLevel.FULL,
    reserved_quantity: null,
    category_id: null,
    created_at: serverTimestamp(),
  })
  return docRef.id
}

// ─── Get All Food Items for User ──────────────────────────────────────────────

export async function getUserFoodItems(uid: string): Promise<FoodItem[]> {
  const q = query(
    collection(db, FOOD_COL),
    where('user_id', '==', uid),
    orderBy('expiry_date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FoodItem))
}

// ─── Get Single Food Item ─────────────────────────────────────────────────────

export async function getFoodItem(foodId: string): Promise<FoodItem> {
  const snap = await getDoc(doc(db, FOOD_COL, foodId))
  if (!snap.exists()) throw new Error('Food item not found')
  return { id: snap.id, ...snap.data() } as FoodItem
}

// ─── Update Food Item ─────────────────────────────────────────────────────────

export async function updateFoodItem(
  foodId: string,
  updates: Partial<FoodItem>
): Promise<void> {
  await updateDoc(doc(db, FOOD_COL, foodId), updates)
}

// ─── Log Food Action (finished / wasted) ─────────────────────────────────────

export async function logFoodAction(
  uid: string,
  payload: LogFoodActionPayload,
): Promise<string> {
  const docRef = await addDoc(collection(db, FOOD_ACTIONS_COL), {
    user_id: uid,
    ...payload,
    actioned_at: serverTimestamp(),
  })
  return docRef.id
}

// ─── Get Food Actions for User ────────────────────────────────────────────────

export async function getFoodActions(
  uid: string,
  kind?: FoodActionKindValue,
): Promise<FoodAction[]> {
  const q = query(collection(db, FOOD_ACTIONS_COL), where('user_id', '==', uid))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as FoodAction))
    .filter((action) => (kind ? action.kind === kind : true))
    .sort((a, b) => toActionTimestamp(b.actioned_at) - toActionTimestamp(a.actioned_at))
}

function toActionTimestamp(value: unknown): number {
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

// ─── Delete Food Item ─────────────────────────────────────────────────────────

export async function deleteFoodItem(foodId: string): Promise<void> {
  await deleteDoc(doc(db, FOOD_COL, foodId))
}

// ─── Mark as Used ────────────────────────────────────────────────────────────

export async function markFoodAsUsed(foodId: string): Promise<void> {
  await updateDoc(doc(db, FOOD_COL, foodId), { status: FoodStatus.USED })
}

// ─── Mark as Planned ─────────────────────────────────────────────────────────

export async function markFoodAsPlanned(
  foodId: string,
  reservedQuantity: number
): Promise<void> {
  await updateDoc(doc(db, FOOD_COL, foodId), {
    status: FoodStatus.PLANNED,
    reserved_quantity: reservedQuantity,
  })
}

// ─── Mark as Donated ─────────────────────────────────────────────────────────

export async function markFoodAsDonated(foodId: string): Promise<void> {
  await updateDoc(doc(db, FOOD_COL, foodId), { status: FoodStatus.DONATED })
}

// ─── Get Expiring Soon Items ──────────────────────────────────────────────────

export async function getExpiringSoonItems(
  uid: string,
  days: number = 3
): Promise<FoodItem[]> {
  const now = new Date()
  const future = new Date()
  future.setDate(now.getDate() + days)

  const q = query(
    collection(db, FOOD_COL),
    where('user_id', '==', uid),
    where('status', '==', FoodStatus.AVAILABLE),
    where('expiry_date', '>=', now.toISOString()),
    where('expiry_date', '<=', future.toISOString()),
    orderBy('expiry_date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FoodItem))
}

// ─── Get Items by Status ──────────────────────────────────────────────────────

export async function getFoodItemsByStatus(
  uid: string,
  status: FoodStatusType
): Promise<FoodItem[]> {
  const q = query(
    collection(db, FOOD_COL),
    where('user_id', '==', uid),
    where('status', '==', status),
    orderBy('expiry_date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FoodItem))
}
