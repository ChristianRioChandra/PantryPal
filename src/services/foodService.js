// services/foodService.js
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

const FOOD_COL = 'food'

// ─── Food Status Enum ─────────────────────────────────────────────────────────
export const FoodStatus = {
  AVAILABLE: 'available',
  USED: 'used',
  DONATED: 'donated',
  PLANNED: 'planned', // reserved for meal plan
}

// ─── Food Type Enum ───────────────────────────────────────────────────────────
export const FoodType = {
  FRIDGE: 'fridge',
  PANTRY: 'pantry',
  FREEZER: 'freezer',
}

export const QuantityLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  FULL: 'full',
}

// ─── Add Food Item ────────────────────────────────────────────────────────────

/**
 * Add a new food item to the user's inventory.
 */
export async function addFoodItem(uid, { name, quantity, unit, expiryDate, categoryId, type, storageLocation, notes }) {
  const docRef = await addDoc(collection(db, FOOD_COL), {
    user_id: uid,
    category_id: categoryId || null,
    name,
    quantity,
    unit,           // e.g. 'kg', 'pcs', 'L'
    expiry_date: expiryDate,
    type,           // fridge | pantry | freezer
    storage_location: storageLocation || null,
    notes: notes || null,
    status: FoodStatus.AVAILABLE,
    quantity_level: QuantityLevel.FULL,
    created_at: serverTimestamp(),
  })
  return docRef.id
}

// ─── Get All Food Items for User ──────────────────────────────────────────────

export async function getUserFoodItems(uid) {
  const q = query(
    collection(db, FOOD_COL),
    where('user_id', '==', uid),
    orderBy('expiry_date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Get Single Food Item ─────────────────────────────────────────────────────

export async function getFoodItem(foodId) {
  const snap = await getDoc(doc(db, FOOD_COL, foodId))
  if (!snap.exists()) throw new Error('Food item not found')
  return { id: snap.id, ...snap.data() }
}

// ─── Update Food Item ─────────────────────────────────────────────────────────

export async function updateFoodItem(foodId, updates) {
  await updateDoc(doc(db, FOOD_COL, foodId), updates)
}

// ─── Delete Food Item ─────────────────────────────────────────────────────────

export async function deleteFoodItem(foodId) {
  await deleteDoc(doc(db, FOOD_COL, foodId))
}

// ─── Mark as Used ────────────────────────────────────────────────────────────

export async function markFoodAsUsed(foodId) {
  await updateDoc(doc(db, FOOD_COL, foodId), {
    status: FoodStatus.USED,
  })
}

// ─── Mark as Planned (for Meal) ───────────────────────────────────────────────

export async function markFoodAsPlanned(foodId, reservedQuantity) {
  await updateDoc(doc(db, FOOD_COL, foodId), {
    status: FoodStatus.PLANNED,
    reserved_quantity: reservedQuantity,
  })
}

// ─── Mark as Donated ─────────────────────────────────────────────────────────

export async function markFoodAsDonated(foodId) {
  await updateDoc(doc(db, FOOD_COL, foodId), {
    status: FoodStatus.DONATED,
  })
}

// ─── Get Expiring Soon Items (within N days) ──────────────────────────────────

export async function getExpiringSoonItems(uid, days = 3) {
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
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Get Items by Status ──────────────────────────────────────────────────────

export async function getFoodItemsByStatus(uid, status) {
  const q = query(
    collection(db, FOOD_COL),
    where('user_id', '==', uid),
    where('status', '==', status),
    orderBy('expiry_date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
