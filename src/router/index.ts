import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import landingPageView from '../views/landingPageView.vue'
import PantryPalDashboard from '../views/PantryPalDashboard.vue'
import ManageInventory from '../views/ManageInventory.vue'
import PantryPalDonationListing from '../views/PantryPalDonationListing.vue'
import PantryPalWeeklyMealPlan from '../views/PantryPalWeeklyMealPlan.vue'
import Settings from '../views/Settings.vue'
import Analytics from '../views/AnalyticsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },

    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      name: 'landing',
      component: landingPageView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: PantryPalDashboard,
    },
    {
      path: '/donations',
      name: 'donations',
      component: PantryPalDonationListing,
    },
    {
      path: '/meal-plan',
      name: 'meal-plan',
      component: PantryPalWeeklyMealPlan,
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: ManageInventory,
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
    },
    // analytics
    {
      path: '/analytics',
      name: 'analytics',
      component: Analytics,
    },
  ],
})

router.beforeEach((to, from, next) => {
  const isLogin = localStorage.getItem('isLogin')

  if (!isLogin && to.name !== 'login' && to.name !== 'register' && to.path !== '/') {
    next('/login')
  } else {
    next()
  }
})

export default router
