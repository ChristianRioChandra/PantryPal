// services/mealPlanService.ts
import {
  collection,
  doc,
  addDoc,
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

// ─── Enums ────────────────────────────────────────────────────────────────────

export const MealType = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
} as const

export type MealTypeValue = (typeof MealType)[keyof typeof MealType]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateMealPlanPayload {
  date: string // ISO date string e.g. '2026-04-14'
  description?: string | null
}

export interface MealPlan {
  id: string
  user_id: string
  date: string
  description: string | null
  created_at: unknown // Firestore Timestamp
}

export interface AddMealPlanItemPayload {
  foodId: string
  mealDate: string
  mealType: MealTypeValue
  reservedQuantity: number
  recipeName?: string | null
}

export interface MealPlanItem {
  id: string
  food_id: string
  meal_plan_id: string
  meal_date: string
  meal_type: MealTypeValue
  reserved_quantity: number
  recipe_name: string | null
}

export interface SaveDailyMealPlanSlot {
  mealType: MealTypeValue
  recipeName: string
  foodIds: string[]
  reservedQuantity?: number
}

const PLAN_COL = 'mealPlans'

// ─── Create Meal Plan ─────────────────────────────────────────────────────────

export async function createMealPlan(
  uid: string,
  { date, description }: CreateMealPlanPayload,
): Promise<string> {
  const docRef = await addDoc(collection(db, PLAN_COL), {
    user_id: uid,
    date,
    description: description ?? null,
    created_at: serverTimestamp(),
  })
  return docRef.id
}

// ─── Get User's Meal Plans ────────────────────────────────────────────────────

export async function getUserMealPlans(uid: string): Promise<MealPlan[]> {
  const q = query(collection(db, PLAN_COL), where('user_id', '==', uid), orderBy('date', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MealPlan)
}

// ─── Get Meal Plan by Date ────────────────────────────────────────────────────

export async function getMealPlanByDate(uid: string, date: string): Promise<MealPlan | null> {
  const q = query(collection(db, PLAN_COL), where('user_id', '==', uid), where('date', '==', date))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]!
  return { id: d.id, ...d.data() } as MealPlan
}

// ─── Add Meal Plan Item ───────────────────────────────────────────────────────

export async function addMealPlanItemWithNotification(
  uid: string,
  mealPlanId: string,
  itemData: AddMealPlanItemPayload,
): Promise<string> {
  const itemsCol = collection(db, PLAN_COL, mealPlanId, 'mealPlanItems')

  const docRef = await addDoc(itemsCol, {
    food_id: itemData.foodId,
    meal_plan_id: mealPlanId,
    meal_date: itemData.mealDate,
    meal_type: itemData.mealType,
    reserved_quantity: itemData.reservedQuantity,
    recipe_name: itemData.recipeName ?? null,
  })

  await markFoodAsPlanned(itemData.foodId, itemData.reservedQuantity)

  await createNotification(uid, {
    type: NotificationType.MEAL_REMINDER,
    message: `Reminder: "${itemData.recipeName ?? 'Meal'}" is planned for ${itemData.mealDate} (${itemData.mealType}).`,
    relatedEntityId: mealPlanId,
  })

  return docRef.id
}

// ─── Add Meal Plan Item ───────────────────────────────────────────────────────

export async function addMealPlanItem(
  mealPlanId: string,
  itemData: AddMealPlanItemPayload,
): Promise<string> {
  const itemsCol = collection(db, PLAN_COL, mealPlanId, 'mealPlanItems')

  const docRef = await addDoc(itemsCol, {
    food_id: itemData.foodId,
    meal_plan_id: mealPlanId,
    meal_date: itemData.mealDate,
    meal_type: itemData.mealType,
    reserved_quantity: itemData.reservedQuantity,
    recipe_name: itemData.recipeName ?? null,
  })

  return docRef.id
}

// ─── Get Meal Plan Items ──────────────────────────────────────────────────────

export async function getMealPlanItems(mealPlanId: string): Promise<MealPlanItem[]> {
  const itemsCol = collection(db, PLAN_COL, mealPlanId, 'mealPlanItems')
  const snap = await getDocs(itemsCol)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MealPlanItem)
}

// ─── Save Daily Meal Plan ─────────────────────────────────────────────────────

export async function saveDailyMealPlan(
  uid: string,
  date: string,
  slots: SaveDailyMealPlanSlot[],
): Promise<string> {
  const existingPlan = await getMealPlanByDate(uid, date)
  const mealPlanId =
    existingPlan?.id ?? (await createMealPlan(uid, { date, description: null }))

  const existingItems = await getMealPlanItems(mealPlanId)
  await Promise.all(existingItems.map((item) => deleteMealPlanItem(mealPlanId, item.id)))

  const itemsToSave = slots
    .filter((slot) => slot.recipeName.trim())
    .flatMap((slot) => {
      const foodIds = slot.foodIds.length > 0 ? slot.foodIds : [`manual-${slot.mealType}`]
      return foodIds.map((foodId) => ({
        foodId,
        mealDate: date,
        mealType: slot.mealType,
        reservedQuantity: slot.reservedQuantity ?? 1,
        recipeName: slot.recipeName.trim(),
      }))
    })

  await Promise.all(itemsToSave.map((item) => addMealPlanItem(mealPlanId, item)))

  return mealPlanId
}

// ─── Update Meal Plan Item ────────────────────────────────────────────────────

export async function updateMealPlanItem(
  mealPlanId: string,
  itemId: string,
  updates: Partial<MealPlanItem>,
): Promise<void> {
  const itemRef = doc(db, PLAN_COL, mealPlanId, 'mealPlanItems', itemId)
  await updateDoc(itemRef, updates)
}

// ─── Delete Meal Plan Item ────────────────────────────────────────────────────

export async function deleteMealPlanItem(mealPlanId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, PLAN_COL, mealPlanId, 'mealPlanItems', itemId))
}

// ─── Delete Meal Plan ─────────────────────────────────────────────────────────

export async function deleteMealPlan(mealPlanId: string): Promise<void> {
  await deleteDoc(doc(db, PLAN_COL, mealPlanId))
}
