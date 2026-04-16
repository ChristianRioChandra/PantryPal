// services/notificationService.js
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const NOTIF_COL = 'notifications'

// ─── Notification Type Enum ───────────────────────────────────────────────────
export const NotificationType = {
  EXPIRY_ALERT: 'EXPIRY_ALERT',           // Item nearing expiry
  MOVE_TO_DONATION: 'MOVE_TO_DONATION',   // Suggestion to donate
  DONATION_CLAIMED: 'DONATION_CLAIMED',   // Someone claimed your listing
  DONATION_CONFIRMED: 'DONATION_CONFIRMED', // Your request was confirmed
  DONATION_POSTED: 'DONATION_POSTED',     // You posted a donation
  MEAL_REMINDER: 'MEAL_REMINDER',         // Meal plan reminder
  ACCOUNT_ALERT: 'ACCOUNT_ALERT',         // 2FA, email verified, etc.
}

// ─── Create Notification ──────────────────────────────────────────────────────

/**
 * Create a notification for a user.
 * Called internally by other services (not usually called from UI directly).
 */
export async function createNotification(uid, { type, message, relatedEntityId = null }) {
  await addDoc(collection(db, NOTIF_COL), {
    user_id: uid,
    type,
    message,
    is_read: false,
    related_entity_id: relatedEntityId,
    created_at: serverTimestamp(),
  })
}

// ─── Get All Notifications for User ──────────────────────────────────────────

export async function getUserNotifications(uid) {
  const q = query(
    collection(db, NOTIF_COL),
    where('user_id', '==', uid),
    orderBy('created_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Get Unread Notifications ─────────────────────────────────────────────────

export async function getUnreadNotifications(uid) {
  const q = query(
    collection(db, NOTIF_COL),
    where('user_id', '==', uid),
    where('is_read', '==', false),
    orderBy('created_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Mark Notification as Read ────────────────────────────────────────────────

export async function markNotificationAsRead(notificationId) {
  await updateDoc(doc(db, NOTIF_COL, notificationId), {
    is_read: true,
  })
}

// ─── Mark All Notifications as Read ──────────────────────────────────────────

export async function markAllNotificationsAsRead(uid) {
  const unread = await getUnreadNotifications(uid)
  const promises = unread.map(n => markNotificationAsRead(n.id))
  await Promise.all(promises)
}

// ─── Trigger Expiry Notifications (call on login or scheduled) ───────────────

/**
 * Checks user's food items and creates EXPIRY_ALERT notifications
 * for items expiring within the next 3 days.
 * Import getExpiringSoonItems from foodService before use.
 */
export async function triggerExpiryNotifications(uid, expiringSoonItems) {
  const promises = expiringSoonItems.map(item =>
    createNotification(uid, {
      type: NotificationType.EXPIRY_ALERT,
      message: `"${item.name}" is expiring soon on ${item.expiry_date}. Consider using or donating it.`,
      relatedEntityId: item.id,
    })
  )
  await Promise.all(promises)
}
