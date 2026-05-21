// services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updatePassword,
  updateProfile,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  type User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string
  email: string
  password: string
  householdSize?: number | null
}

export interface PrivacySettings {
  listing_visibility: 'public' | 'private'
  show_location: boolean
}

export interface UserProfile {
  id: string
  name: string
  email: string
  householdSize: number | null
  is_verified: boolean
  two_factor_enabled: boolean
  privacy_settings: PrivacySettings
  inventory_ui_prefs?: InventoryUiPrefs
  email_notifications_enabled?: boolean
  created_at: unknown // Firestore Timestamp
}

export interface UpdateProfilePayload {
  name: string
  householdSize: number | null
}

export interface InventoryUiPrefs {
  layout: 'cards' | 'compact'
  filter: string
  sort: string
  expanded_categories: Record<string, boolean>
}

// ─── Register ────────────────────────────────────────────────────────────────

/**
 * Register a new household user.
 * Creates Firebase Auth account + Firestore /users/{uid} document.
 */
export async function registerUser({
  name,
  email,
  password,
  householdSize = null,
}: RegisterPayload): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  await sendEmailVerification(user)

  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    householdSize,
    is_verified: false,
    two_factor_enabled: true, // OTP required for all users by default
    email_notifications_enabled: true,
    privacy_settings: {
      listing_visibility: 'public',
      show_location: true,
    } as PrivacySettings,
    inventory_ui_prefs: {
      layout: 'cards',
      filter: '',
      sort: 'name',
      expanded_categories: {
        all: true,
        fridge: true,
        pantry: true,
        freezer: true,
        countertop: true,
        expiry: true,
      },
    } as InventoryUiPrefs,
    created_at: serverTimestamp(),
  })

  return user
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  await signOut(auth)
}

// ─── Get User Profile ────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) {
    const currentUser = auth.currentUser
    if (!currentUser || currentUser.uid !== uid || !currentUser.email) {
      throw new Error('User profile not found')
    }

    const defaultProfile = {
      name: currentUser.displayName || currentUser.email.split('@')[0] || 'User',
      email: currentUser.email,
      householdSize: null,
      is_verified: false,
      two_factor_enabled: false,
      email_notifications_enabled: true,
      privacy_settings: {
        listing_visibility: 'public',
        show_location: true,
      } as PrivacySettings,
      inventory_ui_prefs: {
        layout: 'cards',
        filter: '',
        sort: 'name',
        expanded_categories: {
          all: true,
          fridge: true,
          pantry: true,
          freezer: true,
          countertop: true,
          expiry: true,
        },
      } as InventoryUiPrefs,
      created_at: serverTimestamp(),
    }

    await setDoc(doc(db, 'users', uid), defaultProfile)
    return { id: uid, ...defaultProfile } as UserProfile
  }
  return { id: snap.id, ...snap.data() } as UserProfile
}

// ─── Update Privacy Settings ─────────────────────────────────────────────────

export async function updatePrivacySettings(uid: string, settings: PrivacySettings): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    privacy_settings: settings,
  })
}

// ─── Update Profile ───────────────────────────────────────────────────────────

export async function updateUserProfile(
  uid: string,
  { name, householdSize }: UpdateProfilePayload,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { name, householdSize })
  const user = auth.currentUser
  if (user) {
    await updateProfile(user, { displayName: name })
  }
}

// ─── Inventory UI Preferences ────────────────────────────────────────────────

export async function getInventoryUiPrefs(uid: string): Promise<InventoryUiPrefs | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data() as Record<string, unknown>
  return (data['inventory_ui_prefs'] as InventoryUiPrefs) ?? null
}

export async function updateInventoryUiPrefs(uid: string, prefs: InventoryUiPrefs): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { inventory_ui_prefs: prefs })
}

// ─── Change Password ─────────────────────────────────────────────────────────

export async function changePassword(newPassword: string): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')
  await updatePassword(user, newPassword)
}

// ─── 2FA: Enroll Phone (Multi-Factor) ────────────────────────────────────────

export async function enroll2FAStart(
  phoneNumber: string,
  recaptchaContainer: HTMLElement,
): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')

  const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, { size: 'invisible' })
  const multiFactorSession = await multiFactor(user).getSession()

  const phoneInfoOptions = { phoneNumber, session: multiFactorSession }
  const phoneAuthProvider = new PhoneAuthProvider(auth)
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(
    phoneInfoOptions,
    recaptchaVerifier,
  )

  return verificationId
}

export async function enroll2FAComplete(
  verificationId: string,
  verificationCode: string,
  uid: string,
): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')

  const cred = PhoneAuthProvider.credential(verificationId, verificationCode)
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred)
  await multiFactor(user).enroll(multiFactorAssertion, 'Phone Number')

  await updateDoc(doc(db, 'users', uid), { two_factor_enabled: true })
}

export async function updateTwoFactorStatus(uid: string, enabled: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { two_factor_enabled: enabled })
}

export async function updateEmailNotificationsStatus(uid: string, enabled: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { email_notifications_enabled: enabled })
}
