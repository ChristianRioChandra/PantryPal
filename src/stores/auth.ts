import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(true)

  const isLoggedIn = computed(() => user.value !== null)
  const userName = computed(() => user.value?.displayName || user.value?.email?.split('@')[0] || 'User')

  // Initialize auth state listener
  onMounted(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      isLoading.value = false

      // Update localStorage for router guard compatibility
      if (firebaseUser) {
        localStorage.setItem('isLogin', 'true')
      } else {
        localStorage.removeItem('isLogin')
      }
    })

    // Cleanup on unmount (though stores typically persist)
    return unsubscribe
  })

  const logout = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    user,
    isLoading,
    isLoggedIn,
    userName,
    logout
  }
})
