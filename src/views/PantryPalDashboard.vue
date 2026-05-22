<template>
  <div class="dashboard-page">
    <!-- Topbar handles its own notification popup internaly now -->

    <div class="dashboard">
      <BaseSidebar :nav-items="navItems" />

      <div class="main-content">
        <div class="desktop-topbar">
          <BaseTopbar
            ref="topbarRef"
            title="Dashboard"
            search-placeholder="Search food, donations, meals..."
            v-model:search-value="searchQuery"
          />
        </div>

        <div class="dashboard-grid">
          <!-- Welcome Card -->
          <div class="dashboard-card welcome-card">
            <div class="welcome-name">Welcome, {{ authStore.userName }} 👋</div>
            <div class="welcome-sub">Here's what's happening with your Inventory today.</div>
          </div>

          <!-- Expiry Alerts -->
          <div class="dashboard-card alert-card">
            <div class="card-header">
              <i class="bi bi-exclamation-triangle"></i>
              <span>Expiry Alerts</span>
            </div>
            <div class="alert-list">
              <div v-for="alert in expiryAlerts" :key="alert.id" class="alert-item" :class="{ 'alert-expired': alert.days < 0 }">
                ⚠ {{ alert.name }}
                <template v-if="alert.days < 0">
                  expired — {{ Math.abs(alert.days) }} day{{ Math.abs(alert.days) !== 1 ? 's' : '' }} ago
                </template>
                <template v-else-if="alert.days === 0">
                  expires today
                </template>
                <template v-else>
                  is about to expire — {{ alert.days }} day{{ alert.days !== 1 ? 's' : '' }} left
                </template>
              </div>
              <div v-if="expiryAlerts.length === 0" class="no-alerts">
                ✅ No items expiring soon!
              </div>
            </div>
          </div>

          <!-- Inventory Summary -->
          <div class="dashboard-card inventory-card">
            <div class="card-header">
              <i class="bi bi-box-seam"></i>
              <span>Inventory</span>
            </div>
            <div class="inventory-list">
              <div v-for="item in limitedInventoryItems" :key="item.id" class="inventory-item">
                <div class="inv-info">
                  <div class="inv-name">{{ item.name }}</div>
                  <div class="inv-sub">{{ item.location }} · {{ item.type }}</div>
                </div>
                <span class="inv-tag" :class="{ warn: item.tag === 'Expiring', expired: item.tag === 'Expired' }">{{ item.tag }}</span>
              </div>
            </div>
            <button class="card-action-btn" @click="router.push('/inventory')">
              Manage Inventory →
            </button>
          </div>

          <!-- Meal Plan Summary -->
          <div class="dashboard-card meal-card">
            <div class="card-header">
              <i class="bi bi-calendar"></i>
              <span>This Week's Meal Plan</span>
            </div>
            <div class="meal-nav">
              <button class="meal-nav-btn" @click="changeDashboardDate(-1)">
                <i class="bi bi-chevron-left"></i>
              </button>
              <span class="meal-day-title">{{ formattedDashboardDate }}</span>
              <button class="meal-nav-btn" @click="changeDashboardDate(1)">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
            <div v-for="slot in dashboardMealSlots" :key="slot.type" class="meal-slot">
              <div class="meal-slot-label">{{ slot.label }}</div>
              <div v-if="getDashboardSlotMeal(slot.type)" class="meal-slot-name">
                {{ getDashboardSlotMeal(slot.type) }}
              </div>
              <div v-else class="meal-slot-empty">Not planned yet</div>
            </div>
            <button class="card-action-btn" @click="router.push('/meal-plan')">
              Manage Plan →
            </button>
          </div>

          <!-- Recommendations -->
          <div class="dashboard-card reco-card">
            <div class="card-header">
              <i class="bi bi-lightbulb"></i>
              <span>Try Out</span>
            </div>
            <div class="reco-label">Based on expiring items</div>
            <div class="reco-item">Rendang — uses beef, coconut milk</div>
            <div class="reco-item">Milk Pudding — uses milk, sugar</div>
          </div>

          <!-- Food Saved Progress -->
          <div class="dashboard-card progress-card">
            <div class="card-header">
              <i class="bi bi-graph-up"></i>
              <span>Food Saved This Month</span>
            </div>
            <div class="progress-wrapper">
              <div class="progress-label">
                <span>Progress</span>
                <span class="progress-value">65%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 65%"></div>
              </div>
            </div>
            <div class="progress-sub">13 of 20 items used or donated before expiry</div>
          </div>
        </div>
      </div>

      <BaseRightSidebar
        :total-items="inventoryItems.length"
        :expiring-soon="expiringSoonCount"
        @add-food="handleAddFood"
        @donate-items="router.push('/donations')"
        @plan-meal="router.push('/meal-plan')"
      />
    </div>

    <!-- Mobile Bottom Navigation (appears on small screens) -->
    <nav class="mobile-bottom-nav">
      <button
        v-for="item in navItems.filter(i => i.label !== 'Settings')"
        :key="item.route"
        class="mobile-nav-item"
        :class="{ active: isActiveRoute(item.route) }"
        @click="router.push(item.route)"
      >
        <i v-if="item.icon" :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </button>

    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { getMealPlanByDate, getMealPlanItems } from '@/services/mealPlanService'
import BaseSidebar from '@/components/BaseSidebar.vue'
import BaseTopbar from '@/components/BaseTopbar.vue'
import BaseRightSidebar from '@/components/BaseRightSidebar.vue'
import type { NavItem } from '@/components/BaseSidebar.vue'
import { useNotificationsStore } from '@/stores/notifications'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const topbarRef = ref<any>(null)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

// ─── Topbar is now a shared component ─────────────────────────────────────────


interface InventoryItem {
  id: string
  name: string
  location: string
  type: string
  tag: string
  warning?: boolean
  expiryDate: string
}

const calculateDaysUntil = (expiryDateStr: string): number => {
  if (!expiryDateStr) return 0
  const expiry = new Date(expiryDateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)
  const diffTime = expiry.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const searchQuery = ref('')

const navItems: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'bi bi-graph-up' },
  { label: 'Inventory', route: '/inventory', icon: 'bi bi-box-seam' },
  { label: 'Meal Plan', route: '/meal-plan', icon: 'bi bi-calendar' },
  { label: 'Donation', route: '/donations', icon: 'bi bi-heart' },
  { label: 'Analytics', route: '/analytics', icon: 'bi bi-pie-chart' },
  { label: 'Settings', route: '/settings', icon: 'bi bi-gear' },
]

const inventoryItems = ref<InventoryItem[]>([])
let unsubscribeInventory: (() => void) | null = null

// Filter top 3 items for the dashboard summary
const limitedInventoryItems = computed(() => inventoryItems.value.slice(0, 5))

// Filter items expiring in 3 days or less for alerts
const expiryAlerts = computed(() => {
  return inventoryItems.value
    .filter(item => {
      const days = calculateDaysUntil(item.expiryDate)
      return days <= 3
    })
    .map(item => ({
      id: item.id,
      name: item.name,
      days: calculateDaysUntil(item.expiryDate)
    }))
    .slice(0, 3) // Show top 3 most urgent
})

// Count items expiring soon (0 to 3 days left, excluding already expired)
const expiringSoonCount = computed(() => {
  return inventoryItems.value.filter(item => {
    const days = calculateDaysUntil(item.expiryDate)
    return days >= 0 && days <= 3
  }).length
})

// ─── Meal Plan (Dashboard) ────────────────────────────────────────────────────
const dashboardDate = ref(new Date())

interface DashboardMealSlot {
  type: string
  meal: string
}

const dashboardMealPlan = ref<{ slots: DashboardMealSlot[] } | null>(null)

const dashboardMealSlots = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
]

const formattedDashboardDate = computed(() => {
  return dashboardDate.value.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
})

const fetchDashboardMealPlan = async () => {
  const user = authStore.user
  if (!user) return

  const dateStr = dashboardDate.value.toISOString().split('T')[0]!
  try {
    const plan = await getMealPlanByDate(user.uid, dateStr)
    if (!plan) {
      dashboardMealPlan.value = null
      return
    }

    const items = await getMealPlanItems(plan.id)
    const slots = dashboardMealSlots.map((slot) => {
      const item = items.find((mealItem) => mealItem.meal_type === slot.type)
      return {
        type: slot.type,
        meal: item?.recipe_name ?? '',
      }
    })

    dashboardMealPlan.value = { slots }
  } catch (err) {
    console.error('Error fetching dashboard meal plan:', err)
  }
}

const changeDashboardDate = (days: number) => {
  const newDate = new Date(dashboardDate.value)
  newDate.setDate(newDate.getDate() + days)
  dashboardDate.value = newDate
  fetchDashboardMealPlan()
}

const getDashboardSlotMeal = (type: string) => {
  if (!dashboardMealPlan.value) return null
  const slot = dashboardMealPlan.value.slots.find((s) => s.type === type)
  return slot?.meal || null
}

onMounted(() => {
  if (authStore.user) {
    // Note: Using 'food' collection and 'user_id' / 'expiry_date' to match foodService.ts
    const q = query(
      collection(db, 'food'),
      where('user_id', '==', authStore.user.uid),
      orderBy('expiry_date', 'asc'),
    )

    unsubscribeInventory = onSnapshot(q, (snap) => {
      inventoryItems.value = snap.docs.map((d) => {
        const data = d.data()
        const days = calculateDaysUntil(data.expiry_date)
        return {
          id: d.id,
          name: data.name,
          location: data.storage_location || 'Storage',
          type: data.food_type || 'Other',
          tag: days < 0 ? 'Expired' : (days <= 3 ? 'Expiring' : 'Good'),
          warning: days <= 3,
          expiryDate: data.expiry_date // store for computed properties
        }
      })
    })

    // Initial fetch for meal plan
    fetchDashboardMealPlan()
  }
})

onUnmounted(() => {
  if (unsubscribeInventory) unsubscribeInventory()
})

function handleAddFood() {
  router.push('/inventory?action=add')
}

function isActiveRoute(itemRoute: string) {
  if (itemRoute === '/') return route.path === '/'
  return route.path.startsWith(itemRoute)
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.bi {
  -webkit-text-stroke: 1.1px currentColor;
}

.dashboard-page {
  background: #eef2f8;
  font-family: 'Inter', sans-serif;
  color: #0a1c2f;
  min-height: 100vh;
  padding: 24px 20px;
}

.dashboard {
  max-width: 1760px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) clamp(232px, 18vw, 276px);
  gap: clamp(18px, 2vw, 28px);
  align-items: start;
}

/* ---------- SIDEBAR ---------- */
.sidebar {
  background: white;
  border-radius: 34px;
  box-shadow: 0 18px 45px rgba(31, 47, 62, 0.06);
  padding: 34px 24px 26px;
  position: sticky;
  top: 24px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 44px;
  padding-left: 6px;
}

.logo-icon {
  background: #2c7a4d;
  width: 48px;
  height: 48px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.logo-text {
  font-weight: 800;
  font-size: 1.55rem;
  letter-spacing: -0.5px;
  color: #1e3a2f;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  margin: 8px 0;
  border-radius: 22px;
  font-weight: 500;
  font-size: 0.98rem;
  color: #17304f;
  cursor: pointer;
  transition: 0.2s;
}

.nav-item i {
  width: 24px;
  color: #6883a8;
}

.nav-item:hover {
  background: #f5f9ff;
}

.nav-item.active {
  background: #eef6ef;
  color: #2c6e49;
}

.nav-item.active i {
  color: #2c6e49;
}

hr {
  margin: 28px 0 0;
  border-top: 1px solid #e9edf2;
}

/* ---------- MAIN CONTENT ---------- */
.main-content {
  min-width: 0;
}

.top-bar {
  background: white;
  border-radius: 36px;
  padding: 18px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.02);
}

.page-title h2 {
  font-size: 2.15rem;
  font-weight: 800;
}

.top-bar-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  flex: 1;
  min-width: min(100%, 420px);
  justify-content: flex-end;
}

.search-wrapper {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 60px;
  padding: 0 18px;
  gap: 10px;
  min-width: min(100%, 360px);
  min-height: 50px;
}

.search-wrapper i {
  color: #6f89ad;
  font-size: 1.25rem;
}

.search-wrapper input {
  border: none;
  background: transparent;
  font-size: 0.95rem;
  outline: none;
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.action-icons {
  display: flex;
  gap: 22px;
  font-size: 1.35rem;
  color: #5f7f9e;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.dashboard-card {
  background: white;
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 12px 30px rgba(31, 47, 62, 0.04);
  border: 1px solid #e8eef7;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1e3a2f;
}

.card-header i {
  color: #2c7a4d;
  font-size: 1.3rem;
}

.welcome-name {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.welcome-sub {
  color: #577190;
  font-size: 0.95rem;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  background: #fef3c7;
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #92400e;
  border-left: 4px solid #f59e0b;
}

.alert-expired {
  background: #fee2e2;
  color: #991b1b;
  border-left: 4px solid #ef4444;
}

.inventory-list {
  margin-bottom: 16px;
}

.inventory-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #edf2f7;
}

.inv-icon {
  width: 40px;
  height: 40px;
  background: #f3f6fb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.inv-info {
  flex: 1;
}

.inv-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.inv-sub {
  font-size: 0.8rem;
  color: #6883a8;
}

.inv-tag {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 20px;
  background: #dcfce7;
  color: #166534;
  font-weight: 600;
}

.inv-tag.warn {
  background: #fef3c7;
  color: #92400e;
}

.inv-tag.expired {
  background: #fee2e2;
  color: #991b1b;
}

.card-action-btn {
  width: 100%;
  background: #f3f6fb;
  border: none;
  padding: 12px;
  border-radius: 40px;
  font-weight: 600;
  color: #2c3e4e;
  cursor: pointer;
  transition: 0.2s;
  margin-top: 8px;
}

.card-action-btn:hover {
  background: #e2e8f0;
}

.meal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.meal-nav-btn {
  background: none;
  border: 1px solid #e2e8f0;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  cursor: pointer;
  color: #5f7f9e;
}

.meal-day-title {
  font-weight: 600;
}

.meal-slot {
  padding: 10px 0;
  border-bottom: 1px solid #edf2f7;
}

.meal-slot-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7e95b0;
  margin-bottom: 4px;
}

.meal-slot-name {
  font-weight: 500;
}

.meal-slot-empty {
  color: #9aafc4;
  font-style: italic;
}

.reco-label {
  font-size: 0.8rem;
  color: #7e95b0;
  margin-bottom: 12px;
}

.reco-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 16px;
  margin-bottom: 8px;
  font-weight: 500;
}

.progress-wrapper {
  margin: 16px 0;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.progress-value {
  color: #2c7a4d;
  font-weight: 700;
}

.progress-bar {
  height: 12px;
  background: #e6edf5;
  border-radius: 20px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2c7a4d;
  border-radius: 20px;
}

.progress-sub {
  font-size: 0.8rem;
  color: #6883a8;
  margin-top: 8px;
}

/* ---------- RIGHT SIDEBAR ---------- */
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: sticky;
  top: 24px;
}

.right-box {
  background: white;
  border-radius: 28px;
  padding: 20px;
  box-shadow: 0 16px 42px rgba(31, 47, 62, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.right-btn {
  background: #f3f6fb;
  border: none;
  padding: 13px 16px;
  border-radius: 40px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2c3e4e;
}

.right-btn:hover {
  background: #e2e8f0;
}

.right-btn i {
  width: 20px;
  color: #2c7a4d;
}

.selection-count {
  background: #eef2ff;
  padding: 8px 16px;
  border-radius: 40px;
  font-size: 0.82rem;
  font-weight: 600;
  align-self: flex-start;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #edf2f7;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item .warning {
  color: #d97706;
}

/* ── Notification Popup ────────────────────────────────────────────────────── */
.notif-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(10, 28, 47, 0.35);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 80px 48px 0 0;
}

.notif-popup {
  background: #ffffff;
  border-radius: 20px;
  width: 360px;
  box-shadow: 0 20px 60px rgba(10, 28, 47, 0.18);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notif-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #edf2f7;
}

.notif-popup-title {
  font-weight: 700;
  font-size: 0.95rem;
  color: #0a1c2f;
}

.mark-read-btn {
  background: none;
  border: none;
  font-size: 0.8rem;
  font-weight: 600;
  color: #2c7a4d;
  cursor: pointer;
}

.mark-read-btn:hover {
  text-decoration: underline;
}

.notif-popup-list {
  max-height: 340px;
  overflow-y: auto;
  padding: 8px 0;
}

.notif-popup-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  transition: background 0.15s;
}

.notif-popup-item:hover {
  background: #f8fafc;
}

.notif-popup-item.unread {
  background: #f0f7ff;
}

.notif-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e8f5e9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  border: 1.5px solid #c8e6c9;
}

.notif-item-body {
  flex: 1;
  min-width: 0;
}

.notif-item-title {
  font-weight: 600;
  font-size: 0.88rem;
  color: #0a1c2f;
  margin-bottom: 2px;
}

.notif-item-detail {
  font-size: 0.78rem;
  color: #577190;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-item-date {
  font-size: 0.72rem;
  color: #9aafc4;
}

.notif-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2c7a4d;
  flex-shrink: 0;
  margin-top: 4px;
}

.notif-empty {
  padding: 24px;
  text-align: center;
  color: #9aafc4;
  font-size: 0.88rem;
}

.notif-view-all-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-top: 1px solid #edf2f7;
  background: #ffffff;
  font-size: 0.88rem;
  font-weight: 600;
  color: #2c7a4d;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s;
}

.notif-view-all-btn:hover {
  background: #f0fdf4;
}

/* Blur the dashboard content when popup is open */
.dashboard.blurred {
  filter: blur(2px);
  pointer-events: none;
  user-select: none;
}

/* Mobile Top Navigation */
.mobile-top-shell {
  background: linear-gradient(180deg, #ffffff 0%, #f7faf7 100%);
  border: 1px solid #e3ebdf;
  border-radius: 28px;
  padding: 18px;
  margin-bottom: 18px;
  box-shadow: 0 18px 32px rgba(31, 47, 62, 0.05);
  display: none;
}

.mobile-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.mobile-header-row h1 {
  font-size: 1.9rem;
  font-weight: 800;
  color: #0a1c2f;
}

.mobile-header-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 1.35rem;
  color: #5f7f9e;
}

.mobile-header-actions i.clickable {
  cursor: pointer;
  transition: color 0.2s ease;
}

.mobile-header-actions i.clickable:hover {
  color: #2c7a4d;
}

.notif-bell-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  transform: translate(50%, -50%);
  background: linear-gradient(135deg, #ff4d4d, #e60000);
  color: white;
  font-size: 9px;
  font-weight: 800;
  min-width: 16px;
  height: 16px;
  padding: 0 4.5px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid white;
  pointer-events: none;
  box-shadow: 0 3px 8px rgba(230, 0, 0, 0.35);
  font-family: 'Inter', sans-serif;
  line-height: 1;
}

/* Mobile Bottom Navigation */
.mobile-bottom-nav {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 40;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #deebe2;
  border-radius: 24px;
  box-shadow: 0 16px 44px rgba(31, 47, 62, 0.12);
  padding: 8px 10px;
  backdrop-filter: blur(16px);
  display: none;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
}

.mobile-nav-item {
  border: none;
  background: transparent;
  color: #6b7e93;
  min-height: 58px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-nav-item i {
  font-size: 1.35rem;
}

.mobile-nav-item:hover {
  background: #f0f5f2;
}

.mobile-nav-item.active {
  color: #2c7a4d;
  background: #eef7f1;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 1120px) {
  .dashboard-page {
    padding-bottom: 112px;
  }

  .dashboard {
    grid-template-columns: 1fr;
  }

  .mobile-bottom-nav {
    display: grid;
  }

  /* Hide the desktop sidebar on tablets/phones */
  .dashboard > :deep(.sidebar) {
    display: none;
  }

  .right-sidebar {
    display: none;
  }
}

@media (max-width: 920px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
  .sidebar,
  .right-sidebar {
    position: static;
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
