<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import logoFull from '@/assets/logo/full.png'
import registerBackground from '@/assets/background/bg1.png'
import { registerUser } from '../services/authService'
import { auth } from '../firebase'
import { isFirebaseError } from '@/utils/firebaseErrors'

const router = useRouter()

const email = ref('')
const name = ref('')
const password = ref('')
const confirmPassword = ref('')
const household = ref<number | ''>('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const error = ref('')
const success = ref('')
const loading = ref(false)

export interface NavItem {
  label: string
  route: string
  icon?: string
}

withDefaults(
  defineProps<{
    navItems: NavItem[]
    appName?: string
  }>(),
  {
    appName: 'PantryPal',
  },
)

const currentSlide = ref(0)
const slideDuration = 5000 // 5 detik per slide

interface Benefit {
  icon: string
  title: string
  desc: string
}

const benefits: Benefit[] = [
  {
    icon: 'bi bi-currency-dollar',
    title: 'Reduce food spending',
    desc: 'By tracking inventory and expiry dates, users stop buying food they already have and prevent spoilage.',
  },
  {
    icon: 'bi bi-heart-fill',
    title: 'Donation Over Disposal',
    desc: 'Food that would be wasted goes to others who can use it.',
  },
  {
    icon: 'bi bi-calendar-check',
    title: 'Get organized',
    desc: 'Centralized food inventory with categories and locations.',
  },
]

const activeBenefit = computed<Benefit>(() => benefits[currentSlide.value] ?? benefits[0]!)
let slideInterval: ReturnType<typeof setInterval> | undefined

const startCarousel = () => {
  if (slideInterval) clearInterval(slideInterval)
  slideInterval = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % benefits.length
  }, slideDuration)
}

const goToSlide = (index: number) => {
  currentSlide.value = index
  startCarousel()
}

onMounted(() => {
  startCarousel()
})

onUnmounted(() => {
  if (slideInterval) clearInterval(slideInterval)
})

const handleRegister = async () => {
  error.value = ''
  success.value = ''

  // ── Client-side validation ──────────────────────────────────────────────────
  if (!email.value || !name.value || !password.value || !confirmPassword.value) {
    error.value = 'All fields are required!'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match!'
    return
  }

  loading.value = true

  try {
    await registerUser({
      name: name.value,
      email: email.value,
      password: password.value,
      householdSize: household.value !== '' ? Number(household.value) : null,
    })

    // IMPORTANT: Firebase auto-signs the user in after createUserWithEmailAndPassword.
    // We must sign them out immediately — they need to verify their email before logging in.
    // Without this, the router guard sees an authenticated user and redirects to /dashboard.
    await auth.signOut()

    // Show success and prompt to check email
    success.value = 'Account created! Please check your email to verify your account before signing in.'

    // Clear form
    email.value = ''
    name.value = ''
    password.value = ''
    confirmPassword.value = ''
    household.value = ''

    // Redirect to login after 2.5 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2500)
  } catch (err: unknown) {
    console.error('Registration error:', err)

    if (isFirebaseError(err)) {
      // If we have an auth user, it means createUserWithEmailAndPassword succeeded
      // but something later (sendEmailVerification or setDoc) failed.
      if (auth.currentUser) {
        // Account exists but profile setup had issues — sign out so the router guard
        // doesn't redirect to dashboard when we push to /login.
        await auth.signOut()
        success.value = 'Account created! Please check your email to verify. (Note: Profile setup had a minor issue, but you can still log in.)'

        setTimeout(() => {
          router.push('/login')
        }, 4000)
        return
      }

      switch (err.code) {
        case 'auth/email-already-in-use':
          error.value = 'An account with this email already exists.'
          break
        case 'auth/invalid-email':
          error.value = 'Please enter a valid email address.'
          break
        case 'auth/weak-password':
          error.value = 'Password is too weak. Use at least 6 characters.'
          break
        case 'permission-denied':
          error.value = 'Profile creation failed due to permission rules. Please contact support.'
          break
        default:
          error.value = `Registration failed: ${err.code}. Please try again.`
      }
    } else {
      error.value = 'An unexpected error occurred. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <!--  FORM REGISTER -->
    <div class="left">
      <div class="form-wrapper">
        <img class="logo-image" :src="logoFull" :alt="appName" />

        <div class="form-header">
          <h2>Create an account</h2>
          <p>Please enter your details to sign up.</p>
        </div>

        <div class="input-container">
          <label>Full Name</label>
          <input v-model="name" type="text" placeholder="Enter your full name" :disabled="loading" />
        </div>

        <div class="input-container">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="Enter your email" :disabled="loading" />
        </div>

        <div class="input-container">
          <label>Password</label>
          <div class="input-group">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              :disabled="loading"
            />

            <i
              class="bi"
              :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"
              @click="showPassword = !showPassword"
            ></i>
          </div>
        </div>

        <div class="input-container">
          <label>Confirm Password</label>
          <div class="input-group">
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="••••••••"
              :disabled="loading"
            />
            <i
              class="bi"
              :class="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"
              @click="showConfirmPassword = !showConfirmPassword"
            ></i>
          </div>
        </div>

        <div class="input-container">
          <label>Household Size <span class="optional">(optional)</span></label>
          <input
            v-model="household"
            type="number"
            placeholder="e.g., 3"
            min="1"
            :disabled="loading"
          />
        </div>

        <!-- ERROR MESSAGE -->
        <p v-if="error" class="error"><i class="bi bi-exclamation-circle-fill"></i> {{ error }}</p>

        <!-- SUCCESS MESSAGE -->
        <p v-if="success" class="success"><i class="bi bi-check-circle-fill"></i> {{ success }}</p>

        <button class="btn-primary" @click="handleRegister" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Register</span>
        </button>

        <p class="link">
          Already have an account?
          <span @click="router.push('/login')">Sign In here</span>
        </p>
      </div>
    </div>

    <!--  IMMERSIVE CAROUSEL -->
    <div
      class="right"
      :style="{ backgroundImage: `url(${registerBackground})` }"
      aria-label="PantryPal highlights"
    >
      <div class="carousel-overlay">

        <!-- Story Indicators (Progress Bars) -->
        <div class="story-indicators">
          <div
            class="story-bar"
            v-for="(_, index) in benefits"
            :key="index"
            @click="goToSlide(index)"
          >
            <div
              class="story-progress"
              :class="{
                'completed': index < currentSlide,
                'active': index === currentSlide
              }"
              :key="currentSlide === index ? 'active' : 'inactive'"
            ></div>
          </div>
        </div>

        <!-- Carousel Content With animation -->
        <transition name="slide-up" mode="out-in">
          <div class="carousel-content" :key="activeBenefit.title">
            <div class="icon-glass">
              <i :class="activeBenefit.icon"></i>
            </div>
            <h1 class="carousel-title">{{ activeBenefit.title }}</h1>
            <p class="carousel-desc">{{ activeBenefit.desc }}</p>
          </div>
        </transition>

      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* {
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
}

.auth-container {
  display: flex;
  height: 100vh;
  background: #f1f5f9;
}

.left {
  flex: 0 0 45%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  overflow-y: auto;
}

.form-wrapper {
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;

  background: #ffffff;
  padding: 48px 40px;
  border-radius: 24px;
  box-shadow: 0 12px 32px rgba(31, 47, 62, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.8);
  margin: auto 0;
}

.logo-image {
  width: 180px;
  margin-bottom: 32px;
}

.form-header {
  margin-bottom: 28px;
}

.form-header h2 {
  font-size: 2rem;
  font-weight: 800;
  color: #0a1c2f;
  margin: 0 0 8px;
}

.form-header p {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
}

.input-container {
  margin-bottom: 16px;
}

.input-container label {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.optional {
  color: #94a3b8;
  font-weight: 400;
  font-size: 0.75rem;
}

.input-group {
  position: relative;
  width: 100%;
}

input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  outline: none;
  font-size: 0.95rem;
  transition: all 0.2s;
  background: #f8fafc;
}

input:focus {
  border-color: #2c7a4d;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(44, 122, 77, 0.1);
}

input:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
}

.input-group input {
  padding-right: 44px;
}

.input-group i {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #94a3b8;
  font-size: 1.1rem;
  transition: color 0.2s;
}

.input-group i:hover {
  color: #2c7a4d;
}

.error {
  color: #e53e3e;
  font-size: 0.85rem;
  margin: 10px 0 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.success {
  color: #059669;
  font-size: 0.85rem;
  margin: 10px 0 20px;
  font-weight: 500;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #d1fae5;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #a7f3d0;
  line-height: 1.4;
}

.success i {
  font-size: 1.1rem;
  margin-top: -2px;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: #2c7a4d;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 52px;
  margin-top: 8px;
}

.btn-primary:hover:not(:disabled) {
  background: #1f5a38;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(44, 122, 77, 0.25);
}

.btn-primary:disabled {
  background: #94bba5;
  cursor: not-allowed;
}

/* Loading Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.link {
  margin-top: 24px;
  font-size: 0.9rem;
  color: #64748b;
  text-align: center;
}

.link span {
  color: #2c7a4d;
  cursor: pointer;
  font-weight: 700;
  margin-left: 4px;
}

.link span:hover {
  text-decoration: underline;
}

/* ---  IMMERSIVE CAROUSEL AREA --- */
.right {
  flex: 1;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
}

.carousel-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10, 28, 47, 0.4) 0%, rgba(10, 28, 47, 0.1) 40%, rgba(10, 28, 47, 0.95) 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 60px 80px 60px;
}

/* Story-style Progress Indicators */
.story-indicators {
  display: flex;
  gap: 12px;
  width: 100%;
  padding-top: 20px;
}

.story-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  backdrop-filter: blur(4px);
}

.story-progress {
  height: 100%;
  background: #ffffff;
  width: 0%;
  border-radius: 4px;
}

.story-progress.completed {
  width: 100%;
}

.story-progress.active {
  animation: fillProgress 5s linear forwards;
}

@keyframes fillProgress {
  0% { width: 0%; }
  100% { width: 100%; }
}

/* Content Area */
.carousel-content {
  max-width: 600px;
}

.icon-glass {
  width: 72px;
  height: 72px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #ffffff;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.carousel-title {
  color: #ffffff;
  font-size: 3.2rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 0 16px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.carousel-desc {
  color: rgba(255, 255, 255, 0.85);
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0;
  font-weight: 400;
  text-shadow: 0 1px 4px rgba(0,0,0,0.2);
  max-width: 90%;
}

/* Transisi Teks: Slide Up & Fade */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* Responsif untuk layar kecil */
@media (max-width: 992px) {
  .auth-container {
    flex-direction: column-reverse;
  }
  .left {
    flex: 1;
    padding: 20px;
  }
  .right {
    flex: 0 0 350px;
  }
  .carousel-overlay {
    padding: 30px;
  }
  .carousel-title {
    font-size: 2rem;
  }
}
</style>
