// services/categoryService.js
import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

const CAT_COL = 'categories'

// ─── Default Categories (seed on first run) ───────────────────────────────────
export const DEFAULT_CATEGORIES = [
  { id: 'canned', name: 'Canned Goods' },
  { id: 'frozen', name: 'Frozen' },
  { id: 'dairy', name: 'Dairy' },
  { id: 'meat', name: 'Meat & Poultry' },
  { id: 'vegetables', name: 'Vegetables' },
  { id: 'fruits', name: 'Fruits' },
  { id: 'grains', name: 'Grains & Bread' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'snacks', name: 'Snacks' },
  { id: 'condiments', name: 'Condiments & Sauces' },
  { id: 'other', name: 'Other' },
]

// ─── Get All Categories ───────────────────────────────────────────────────────

export async function getCategories() {
  const q = query(collection(db, CAT_COL), orderBy('name', 'asc'))
  const snap = await getDocs(q)

  if (snap.empty) {
    // Return defaults if Firestore has no categories yet
    return DEFAULT_CATEGORIES
  }

  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Add Category ─────────────────────────────────────────────────────────────

export async function addCategory(name) {
  const docRef = await addDoc(collection(db, CAT_COL), { name })
  return docRef.id
}

// ─── Delete Category ──────────────────────────────────────────────────────────

export async function deleteCategory(categoryId) {
  await deleteDoc(doc(db, CAT_COL, categoryId))
}

// ─── Seed Default Categories ──────────────────────────────────────────────────

/**
 * Call once during app initialization to seed default categories.
 */
export async function seedDefaultCategories() {
  const existing = await getDocs(collection(db, CAT_COL))
  if (!existing.empty) return // already seeded

  const promises = DEFAULT_CATEGORIES.map(cat =>
    addDoc(collection(db, CAT_COL), { name: cat.name })
  )
  await Promise.all(promises)
}
