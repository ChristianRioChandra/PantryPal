<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import logoFull from '@/assets/logo/full.png'
import { useAuthStore } from '@/stores/auth'
import { sendOTPEmail } from '@/services/emailService'

const router = useRouter()
const authStore = useAuthStore()

const otp = ref(['', '', '', '', '', ''])
const inputs = ref<(HTMLInputElement | null)[]>([])
const error = ref('')
const successMessage = ref('')

const timer = ref(180)
let interval: ReturnType<typeof setInterval>

// button validation
const isOtpValid = computed(() => otp.value.every((d) => d !== ''))

// timer
const startTimer = () => {
  interval = setInterval(() => {
    if (timer.value > 0) timer.value--
  }, 1000)
}

// time format
const formatTime = () => {
  const m = Math.floor(timer.value / 60)
  const s = timer.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// resend
const resendOTP = async () => {
  if (timer.value > 0) return

  error.value = ''
  successMessage.value = ''

  const userEmail = localStorage.getItem('otp_email')
  if (!userEmail) {
    error.value = 'Email address not found. Please log in again.'
    return
  }

  // Generate new 6-digit OTP code
  const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiryTime = Date.now() + 180000

  localStorage.setItem('otp_code', newOtp)
  localStorage.setItem('otp_expiry', expiryTime.toString())

  try {
    await sendOTPEmail(userEmail, newOtp)
    successMessage.value = 'OTP code has been resent to your email!'
    otp.value = ['', '', '', '', '', '']
    timer.value = 180
    
    // Focus back to first input
    setTimeout(() => {
      inputs.value[0]?.focus()
    }, 50)
  } catch (err) {
    console.error('Email error during resend:', err)
    error.value = 'Failed to send OTP email. Please try again.'
  }
}

// input
const handleInput = (index: number, e: Event) => {
  error.value = ''
  successMessage.value = ''

  const target = e.target as HTMLInputElement
  const value = target.value

  if (value === '') {
    otp.value[index] = ''
    return
  }

  if (!/^[0-9]$/.test(value)) {
    // If multiple characters typed (e.g. key repeat or swift typing), keep only the last numeric digit
    const digitsOnly = value.replace(/\D/g, '')
    if (digitsOnly.length > 0) {
      const lastDigit = digitsOnly[digitsOnly.length - 1]!
      otp.value[index] = lastDigit
      target.value = lastDigit
      if (index < 5) inputs.value[index + 1]?.focus()
    } else {
      // Revert field to its original stored digit
      target.value = otp.value[index] ?? ''
    }
    return
  }

  otp.value[index] = value

  if (index < 5) inputs.value[index + 1]?.focus()
}

// backspace and arrow navigation
const handleKeydown = (index: number, e: KeyboardEvent) => {
  if (e.key === 'Backspace') {
    if (!otp.value[index]) {
      // If current field is empty, delete the previous one and focus it
      if (index > 0) {
        otp.value[index - 1] = ''
        inputs.value[index - 1]?.focus()
      }
    } else {
      // If current field has a value, delete it
      otp.value[index] = ''
    }
  } else if (e.key === 'ArrowLeft' && index > 0) {
    inputs.value[index - 1]?.focus()
  } else if (e.key === 'ArrowRight' && index < 5) {
    inputs.value[index + 1]?.focus()
  }
}

// paste handler
const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault()
  const pasteData = e.clipboardData?.getData('text') || ''
  
  // Extract only numbers and take up to 6 digits
  const digits = pasteData.replace(/\D/g, '').slice(0, 6).split('')
  
  if (digits.length === 0) return

  // Fill in the otp fields
  for (let i = 0; i < 6; i++) {
    if (i < digits.length) {
      otp.value[i] = digits[i]!
    } else {
      otp.value[i] = ''
    }
  }

  error.value = ''
  successMessage.value = ''

  // Focus the last entered digit or 6th input if full
  const focusIndex = Math.min(digits.length - 1, 5)
  inputs.value[focusIndex]?.focus()
}

// verify
const verifyOTP = () => {
  error.value = ''
  successMessage.value = ''

  const finalOTP = otp.value.join('')
  const savedOTP = localStorage.getItem('otp_code')
  const expiry = localStorage.getItem('otp_expiry')

  if (finalOTP.length !== 6) {
    error.value = 'OTP must be 6 digits!'
    return
  }

  if (!savedOTP) {
    error.value = 'No OTP found. Please login again.'
    return
  }

  if (!expiry || Date.now() > Number(expiry)) {
    error.value = 'OTP expired!'
    return
  }

  if (finalOTP !== savedOTP) {
    error.value = 'Wrong OTP!'
    return
  }

  localStorage.removeItem('otp_code')
  localStorage.removeItem('otp_expiry')
  authStore.setOtpVerified(true)

  router.push({ name: 'dashboard' })
}

// lifecycle
onMounted(() => {
  const expiry = localStorage.getItem('otp_expiry')

  if (!expiry || Date.now() > Number(expiry)) {
    error.value = 'OTP expired! Please login again.'
  }

  startTimer()
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<template>
  <div class="auth-container">
    <div class="form-card">
      <img class="logo-image" :src="logoFull" alt="Logo" />

      <h2>Verify OTP</h2>
      <p>Enter the 6-digit code</p>

      <!-- OTP BOX -->
      <div class="otp-box" @paste="handlePaste">
        <input
          v-for="(digit, index) in otp"
          :key="index"
          type="text"
          maxlength="1"
          class="otp-input"
          :value="otp[index]"
          @input="handleInput(index, $event)"
          @keydown="handleKeydown(index, $event)"
          :ref="
            (el) => {
              inputs[index] = el as HTMLInputElement | null
            }
          "
        />
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>

      <!-- TIMER -->
      <p class="timer">
        Resend code in <strong>{{ formatTime() }}</strong>
      </p>

      <!-- RESEND -->
      <p class="resend" :class="{ disabled: timer > 0 }" @click="resendOTP">Resend OTP</p>

      <button @click="verifyOTP" :disabled="!isOtpValid">Verify</button>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f1f5f9;
}

.form-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  width: 350px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

.logo-image {
  width: 190px;
  margin-bottom: 15px;
}

h2 {
  margin-bottom: 5px;
}

p {
  margin-bottom: 10px;
  color: #666;
}

.otp-box {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
}

.otp-input {
  width: 45px;
  height: 55px;
  font-size: 22px;
  text-align: center;
  border-radius: 8px;
  border: 1px solid #ddd;
  outline: none;
}

.otp-input:focus {
  border-color: #22c55e;
  box-shadow: 0 0 5px rgba(34, 197, 94, 0.5);
}

.timer {
  font-size: 13px;
  margin-bottom: 5px;
}

.resend {
  font-size: 14px;
  color: #22c55e;
  cursor: pointer;
  margin-bottom: 10px;
}

.resend.disabled {
  color: gray;
  cursor: not-allowed;
}

button {
  width: 100%;
  padding: 12px;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 8px;
}

button:disabled {
  background: #e5e7eb;
    cursor: not-allowed;
  opacity: 0.9;
}

.error {
  color: red;
  font-size: 14px;
  margin-bottom: 10px;
}

.success {
  color: #22c55e;
  font-size: 14px;
  margin-bottom: 10px;
}
</style>
