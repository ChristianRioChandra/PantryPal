// services/mealPlanService.js
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
import { markFoodAsPlanned } from './foodService'
import { createNotification, NotificationType } from './notificationService'

const PLAN_COL = 'mealPlans'

// ─── Meal Type Enum ───────────────────────────────────────────────────────────
export const MealType = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
}

// ─── Create Meal Plan (for a week) ───────────────────────────────────────────

/**
 * Create a new meal plan document for a specific date/week.
 */
export async function createMealPlan(uid, { date, description }) {
  const docRef = await addDoc(collection(db, PLAN_COL), {
    user_id: uid,
    date,          // ISO date string e.g. '2025-08-01'
    description: description || null,
    created_at: serverTimestamp(),
  })
  return docRef.id
}

// ─── Get User's Meal Plans ────────────────────────────────────────────────────

export async function getUserMealPlans(uid) {
  const q = query(
    collection(db, PLAN_COL),
    where('user_id', '==', uid),
    orderBy('date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Get Meal Plan for a Specific Date ───────────────────────────────────────

export async function getMealPlanByDate(uid, date) {
  const q = query(
    collection(db, PLAN_COL),
    where('user_id', '==', uid),
    where('date', '==', date)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

// ─── Add Meal Plan Item (subcollection) ───────────────────────────────────────

/**
 * Add a meal item to a plan's subcollection.
 * Links a food inventory item to a specific meal slot.
 */
export async function addMealPlanItem(mealPlanId, {
  foodId,
  mealDate,
  mealType,
  reservedQuantity,
  recipeName,
}) {
  const itemsCol = collection(db, PLAN_COL, mealPlanId, 'mealPlanItems')
  const docRef = await addDoc(itemsCol, {
    food_id: foodId,
    meal_plan_id: mealPlanId,
    meal_date: mealDate,
    meal_type: mealType,  // breakfast | lunch | dinner | snack
    reserved_quantity: reservedQuantity,
    recipe_name: recipeName || null,
  })

  // Reserve the food item in inventory
  await markFoodAsPlanned(foodId, reservedQuantity)

  // Schedule a meal reminder notification
  await createNotification(null, {  // uid injected from caller
    type: NotificationType.MEAL_REMINDER,
    message: `Reminder: You have "${recipeName || 'a meal'}" planned for ${mealDate} (${mealType}).`,
    relatedEntityId: mealPlanId,
  })

  return docRef.id
}

/**
 * Wrapper that includes uid for notification.
 */
export async function addMealPlanItemWithNotification(uid, mealPlanId, itemData) {
  const itemsCol = collection(db, PLAN_COL, mealPlanId, 'mealPlanItems')
  const docRef = await addDoc(itemsCol, {
    food_id: itemData.foodId,
    meal_plan_id: mealPlanId,
    meal_date: itemData.mealDate,
    meal_type: itemData.mealType,
    reserved_quantity: itemData.reservedQuantity,
    recipe_name: itemData.recipeName || null,
  })

  await markFoodAsPlanned(itemData.foodId, itemData.reservedQuantity)

  await createNotification(uid, {
    type: NotificationType.MEAL_REMINDER,
    message: `Reminder: "${itemData.recipeName || 'Meal'}" is planned for ${itemData.mealDate} (${itemData.mealType}).`,
    relatedEntityId: mealPlanId,
  })

  return docRef.id
}

// ─── Get Meal Plan Items ──────────────────────────────────────────────────────

export async function getMealPlanItems(mealPlanId) {
  const itemsCol = collection(db, PLAN_COL, mealPlanId, 'mealPlanItems')
  const snap = await getDocs(itemsCol)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Update Meal Plan Item ────────────────────────────────────────────────────

export async function updateMealPlanItem(mealPlanId, itemId, updates) {
  const itemRef = doc(db, PLAN_COL, mealPlanId, 'mealPlanItems', itemId)
  await updateDoc(itemRef, updates)
}

// ─── Delete Meal Plan Item ────────────────────────────────────────────────────

export async function deleteMealPlanItem(mealPlanId, itemId) {
  const itemRef = doc(db, PLAN_COL, mealPlanId, 'mealPlanItems', itemId)
  await deleteDoc(itemRef)
}

// ─── Delete Entire Meal Plan ──────────────────────────────────────────────────

export async function deleteMealPlan(mealPlanId) {
  await deleteDoc(doc(db, PLAN_COL, mealPlanId))
}
