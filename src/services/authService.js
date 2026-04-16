// services/authService.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updatePassword,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

// ─── Register ────────────────────────────────────────────────────────────────

/**
 * Register a new household user.
 * Creates Firebase Auth account + Firestore /users/{uid} document.
 */
export async function registerUser({ name, email, password, householdSize = null }) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  // Send email verification
  await sendEmailVerification(user)

  // Create Firestore user document
  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    householdSize,
    is_verified: false,
    two_factor_enabled: false,
    privacy_settings: {
      listing_visibility: 'public', // 'public' | 'private'
      show_location: true,
    },
    created_at: serverTimestamp(),
  })

  return user
}

// ─── Login ───────────────────────────────────────────────────────────────────

/**
 * Sign in an existing user.
 */
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logoutUser() {
  await signOut(auth)
}

// ─── Get User Profile ────────────────────────────────────────────────────────

/**
 * Fetch user profile from Firestore.
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) throw new Error('User profile not found')
  return { id: snap.id, ...snap.data() }
}

// ─── Update Privacy Settings ─────────────────────────────────────────────────

/**
 * Update user's privacy/security settings.
 * @param {string} uid
 * @param {object} settings - Partial privacy_settings object
 */
export async function updatePrivacySettings(uid, settings) {
  await updateDoc(doc(db, 'users', uid), {
    privacy_settings: settings,
  })
}

// ─── Update Profile ───────────────────────────────────────────────────────────

export async function updateUserProfile(uid, { name, householdSize }) {
  await updateDoc(doc(db, 'users', uid), {
    name,
    householdSize,
  })
}

// ─── Change Password ─────────────────────────────────────────────────────────

export async function changePassword(newPassword) {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')
  await updatePassword(user, newPassword)
}

// ─── 2FA: Enroll Phone (Multi-Factor) ────────────────────────────────────────

/**
 * Step 1: Send SMS verification code to enroll 2FA.
 * @param {string} phoneNumber - e.g. '+601XXXXXXXX'
 * @param {HTMLElement} recaptchaContainer - DOM element for reCAPTCHA
 */
export async function enroll2FAStart(phoneNumber, recaptchaContainer) {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')

  const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, { size: 'invisible' })
  const multiFactorSession = await multiFactor(user).getSession()

  const phoneInfoOptions = { phoneNumber, session: multiFactorSession }
  const phoneAuthProvider = new PhoneAuthProvider(auth)
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier)

  return verificationId
}

/**
 * Step 2: Complete 2FA enrollment with the SMS code.
 */
export async function enroll2FAComplete(verificationId, verificationCode, uid) {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')

  const cred = PhoneAuthProvider.credential(verificationId, verificationCode)
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred)
  await multiFactor(user).enroll(multiFactorAssertion, 'Phone Number')

  // Update Firestore flag
  await updateDoc(doc(db, 'users', uid), { two_factor_enabled: true })
}
