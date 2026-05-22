<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import logoFull from '@/assets/logo/full.png'
import loginBackground from '@/assets/background/bg1.png'
import { loginUser, getUserProfile } from '../services/authService'
import { isFirebaseError } from '@/utils/firebaseErrors'
import { sendOTPEmail } from '@/services/emailService'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
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
    icon: 'fa-solid fa-calendar-check',
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
  startCarousel() // Reset timer saat user klik manual
}

onMounted(() => {
  startCarousel()
})

onUnmounted(() => {
  if (slideInterval) clearInterval(slideInterval)
})

const handleLogin = async () => {
  error.value = ''

  if (!email.value || !password.value) {
    error.value = 'Email and password are required!'
    return
  }

  loading.value = true

  try {
    const user = await loginUser(email.value, password.value)
    const userEmail = user.email || email.value

    if (!user.emailVerified) {
      error.value = 'Please verify your email before logging in.'
      return
    }

    // Fetch Firestore profile to get the authoritative 2FA setting.
    // localStorage may be stale (e.g. after logout resets it to false),
    // so we always trust Firestore as the source of truth.
    try {
      const profile = await getUserProfile(user.uid)
      authStore.setTwoFactorEnabled(profile.two_factor_enabled)
    } catch {
      // If profile fetch fails, default to requiring OTP (fail-safe)
      authStore.setTwoFactorEnabled(true)
    }

    if (authStore.twoFactorEnabled) {
      // Generate OTP Random Number
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiryTime = Date.now() + 180000

      localStorage.setItem('otp_code', otp)
      localStorage.setItem('otp_expiry', expiryTime.toString())
      localStorage.setItem('otp_email', userEmail)

      try {
        await sendOTPEmail(userEmail, otp)
      } catch (err) {
        console.error('Email error:', err)
      }

      router.push('/otp')
    } else {
      localStorage.setItem('isLogin', 'true')
      router.push('/dashboard')
    }
  } catch (err: unknown) {
    if (isFirebaseError(err)) {
      switch (err.code) {
        case 'auth/user-not-found':
          error.value = 'No account found with this email.'
          break
        case 'auth/wrong-password':
          error.value = 'Incorrect password.'
          break
        default:
          error.value = 'Login failed.'
      }
    } else {
      console.error(err)
      error.value = 'An unexpected error occurred.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="left">
      <div class="form-wrapper">
        <img class="logo-image" :src="logoFull" :alt="appName" />

        <div class="form-header">
          <h2>Welcome back</h2>
          <p>Please enter your details to sign in.</p>
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

        <p v-if="error" class="error"><i class="bi bi-exclamation-circle-fill"></i> {{ error }}</p>

        <button class="btn-login" @click="handleLogin" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Sign In</span>
        </button>

        <p class="link">
          Don't have an account?
          <span @click="router.push('/register')">Register now</span>
        </p>
      </div>
    </div>

    <!-- Right: Immersive Carousel -->
    <div
      class="right"
      :style="{ backgroundImage: `url(${loginBackground})` }"
      aria-label="PantryPal highlights"
    >
      <!-- Dark Gradient Overlay from bottom to top -->
      <div class="carousel-overlay">

        <!-- Story Indicators (Progress Bars) -->
        <div class="story-indicators">
          <div
            class="story-bar"
            v-for="(_, index) in benefits"
            :key="index"
            @click="goToSlide(index)"
          >
            <!-- Logic: full if already passed, animate if active -->
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

        <!-- Carousel Content -->
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
}

.form-wrapper {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;

  background: #ffffff;
  padding: 48px 40px;
  border-radius: 24px;
  box-shadow: 0 12px 32px rgba(31, 47, 62, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.logo-image {
  width: 180px;
  margin-bottom: 40px;
}

.form-header {
  margin-bottom: 32px;
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
  margin-bottom: 20px;
}

.input-container label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
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
  transition: color 0.2s;
}

.input-group i:hover {
  color: #2c7a4d;
}

.error {
  color: #e53e3e;
  font-size: 0.85rem;
  margin: 0 0 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-login {
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
}

.btn-login:hover:not(:disabled) {
  background: #1f5a38;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(44, 122, 77, 0.25);
}

.btn-login:disabled {
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
