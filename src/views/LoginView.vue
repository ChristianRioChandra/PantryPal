<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import logoFull from '@/assets/logo/full.png'
import loginBackground from '@/assets/background/bg1.png'
import { loginUser } from '../services/authService'
import { isFirebaseError } from '@/utils/firebaseErrors'
import { sendOTPEmail } from '@/services/emailService'

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

export interface NavItem {
  label: string
  route: string
  icon?: string // optional; if missing, uses nav-dot
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
    desc: 'Food that would be wasted goes to others who can use it',
  },
  {
    icon: 'fa-solid fa-calendar-check',
    title: 'Get organized',
    desc: 'Centralized food inventory with categories and locations',
  },
]

const activeBenefit = computed<Benefit>(() => benefits[currentSlide.value] ?? benefits[0]!)
let slideInterval: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  slideInterval = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % benefits.length
  }, 4000)
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

    console.log('FINAL EMAIL:', userEmail)

    if (!user.emailVerified) {
      error.value = 'Please verify your email before logging in.'
      return
    }

    console.log('SEND TO:', userEmail)

    // Generate OTP Random Number
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiryTime = Date.now() + 180000

    // save OTP in localStorage
    localStorage.setItem('otp_code', otp)
    localStorage.setItem('otp_expiry', expiryTime.toString())
    localStorage.setItem('otp_email', userEmail)

    console.log('OTP DEBUG:', otp)


    sendOTPEmail(userEmail, otp)
      .then(() => console.log('Email sent'))
      .catch((err) => console.error('Email error:', err))

    // route to OTP page
    router.push('/otp')

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
      <div class="form-card">
        <img class="logo-image" :src="logoFull" :alt="appName" />



        <!-- EMAIL (changed from username to email for Firebase) -->
        <input v-model="email" type="email" placeholder="Email" :disabled="loading" />

        <!-- PASSWORD -->
        <div class="input-group">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
            :disabled="loading"
          />
          <i
            class="fa-solid"
            :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"
            @click="showPassword = !showPassword"
          ></i>
        </div>

        <!-- ERROR -->
        <p v-if="error" class="error">{{ error }}</p>

        <!-- LOGIN BUTTON -->
        <button @click="handleLogin" :disabled="loading">
          <span v-if="loading">Logging in...</span>
          <span v-else>Login</span>
        </button>

        <!-- LINK TO REGISTER -->
        <p class="link">
          Don't have an account?
          <span @click="router.push('/register')">Register</span>
        </p>
      </div>
    </div>

    <div
      class="right"
      :style="{ backgroundImage: `url(${loginBackground})` }"
      aria-label="PantryPal highlights"
    >
      <div class="carousel-container">
        <div class="carousel-slide" :key="activeBenefit.title">
          <div class="carousel-icon">
            <i :class="activeBenefit.icon"></i>
          </div>
          <h4>{{ activeBenefit.title }}</h4>
          <p>{{ activeBenefit.desc }}</p>
        </div>

        <div class="carousel-dots" aria-label="Carousel slides">
          <button
            v-for="(_, index) in benefits"
            :key="index"
            type="button"
            class="carousel-dot"
            :class="{ active: index === currentSlide }"
            :aria-label="`Show slide ${index + 1}`"
            :aria-pressed="index === currentSlide"
            @click="currentSlide = index"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  height: 100vh;
  background: #f1f5f9;
}

.left {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-card {
  background: #ffffff;
  padding: 40px;
  border-radius: 16px;
  width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.right {
  flex: 1;
  align-items: center;
  background-color: #ffffff;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 40px;
}

.logo-area {
  display: flex;
  align-items: center;
  margin-bottom: 44px;
  padding-left: 6px;
}

.logo-image {
  display: block;
  width: min(100%, 175px);
  height: auto;
  padding-bottom: 25px;
}

h2 {
  margin-bottom: 20px;
}

.input-group {
  position: relative;
  width: 100%;
}

input {
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  border-radius: 8px;
  border: 1px solid #ddd;
  outline: none;
}

input:disabled {
  background: #f8fafc;
  cursor: not-allowed;
}

.input-group input {
  padding-right: 40px;
}

input:focus {
  border-color: #22c55e;
}

.input-group i {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #555;
}

.error {
  color: red;
  font-size: 12px;
  margin-top: 5px;
  text-align: center;
}

button {
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  border: none;
  border-radius: 8px;
  background: #22c55e;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #16a34a;
}

button:disabled {
  background: #86efac;
  cursor: not-allowed;
}

.link {
  margin-top: 10px;
  font-size: 14px;
}

.link span {
  color: #22c55e;
  cursor: pointer;
  font-weight: 600;
}

.carousel-container {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(100%, 320px);
}

.carousel-slide {
  animation: slide-fade 0.35s ease;
  background: rgba(255, 255, 255, 0.7);
  min-height: 210px;
  padding: 20px;
  text-align: center;
  width: 100%;
  border-radius: 25px;
}

.carousel-icon {
  color: #242424;
  display: inline-block;
  font-size: 3.2rem;
  line-height: 1;
  margin-bottom: 20px;
  position: relative;
}



.carousel-slide h4 {
  color: #242424;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.3;
  margin: 0 0 14px;
}

.carousel-slide p {
  color: #2b2b2b;
  font-size: 0.72rem;
  line-height: 1.6;
  margin: 0;
}

.carousel-dots {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.carousel-dot {
  background: #ffffff;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  height: 18px;
  padding: 0;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  width: 18px;
}

.carousel-dot:not(.active) {
  opacity: 0.35;
}

.carousel-dot.active {
  transform: scale(1.08);
}

@keyframes slide-fade {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>
