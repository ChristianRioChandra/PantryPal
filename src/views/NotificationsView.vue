<template>
  <div class="notifications-page">
    <div class="notifications-shell">
      <BaseSidebar :nav-items="navItems" />

      <div class="main-content">
        <!-- Top Bar -->
        <div class="desktop-topbar">
          <BaseTopbar
            ref="topbarRef"
            title="Notifications"
            show-back-button
            @back="goBack"
            search-placeholder="Search notifications..."
            v-model:search-value="searchQuery"
            :unread-count="notificationsStore.unreadCount"
            @open-notifications="
              () => {
                showNotifPopup = true
              }
            "
          />
        </div>

        <!-- Sleek Bulk Manage Bar (renders just above the list) -->
        <div class="notif-manage-bar">
          <div class="manage-bar-left">
            <button
              type="button"
              class="manage-pill-btn select-all-pill"
              :class="{ active: selectAll }"
              @click="
                selectAll = !selectAll,
                toggleSelectAll()
              "
            >
              <i class="bi" :class="selectAll ? 'bi-check-square-fill' : 'bi-square'"></i>
              <span>Select All</span>
            </button>
            <transition name="fade">
              <span v-if="selectedIds.size > 0" class="selected-count-badge">
                {{ selectedIds.size }} selected
              </span>
            </transition>
          </div>

          <transition name="slide-fade">
            <div class="manage-bar-right" v-if="selectedIds.size > 0">
              <button
                type="button"
                class="manage-action-btn danger"
                @click="deleteSelected"
                title="Delete selected"
              >
                <i class="bi bi-trash"></i>
                <span>Delete</span>
              </button>
              <button
                type="button"
                class="manage-action-btn success"
                @click="markSelectedAsRead"
                title="Mark as read"
              >
                <i class="bi bi-check2-all"></i>
                <span>Read</span>
              </button>
            </div>
          </transition>
        </div>

        <!-- Notification List -->
        <div class="notif-list">
          <!-- Empty State -->
          <div v-if="filteredNotifications.length === 0" class="notif-empty">
            <i class="bi bi-bell-slash"></i>
            <p>No notifications yet.</p>
          </div>

          <!-- Notification Item -->
          <div
            v-for="notif in filteredNotifications"
            :key="notif.id"
            class="notif-item"
            :class="{ unread: !notif.read, selected: selectedIds.has(notif.id) }"
            @click="handleNotifClick(notif)"
            style="cursor: pointer"
          >
            <!-- Checkbox -->
            <input
              type="checkbox"
              class="notif-checkbox"
              :checked="selectedIds.has(notif.id)"
              @change="toggleSelect(notif.id)"
              @click.stop
            />

            <!-- Icon -->
            <div class="notif-icon"><i class="bi" :class="notif.icon"></i></div>

            <!-- Body -->
            <div class="notif-body">
              <div class="notif-header-row">
                <div class="notif-title-block">
                  <span class="notif-title">{{ notif.title }}</span>
                  <span class="notif-type">{{ notif.typeLabel }}</span>
                  <span class="notif-detail">{{ notif.detail }}</span>
                </div>
                <div class="notif-meta">
                  <span class="notif-date">{{ notif.date }}</span>
                  <span class="notif-time">{{ notif.time }}</span>
                </div>
              </div>
            </div>

            <!-- Unread indicator -->
            <div v-if="!notif.read" class="unread-dot"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Bottom Navigation (appears on small screens) -->
    <nav class="mobile-bottom-nav">
      <button
        v-for="item in navItems.filter((i) => i.label !== 'Settings')"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BaseSidebar from '@/components/BaseSidebar.vue'
import BaseTopbar from '@/components/BaseTopbar.vue'
import type { NavItem } from '@/components/BaseSidebar.vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const navItems: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'bi bi-graph-up' },
  { label: 'Inventory', route: '/inventory', icon: 'bi bi-box-seam' },
  { label: 'Meal Plan', route: '/meal-plan', icon: 'bi bi-calendar' },
  { label: 'Donation', route: '/donations', icon: 'bi bi-heart' },
  { label: 'Analytics', route: '/analytics', icon: 'bi bi-pie-chart' },
  { label: 'Settings', route: '/settings', icon: 'bi bi-gear' },
]

// ─── State ────────────────────────────────────────────────────────────────────
const topbarRef = ref<any>(null)
const notificationsStore = useNotificationsStore()
const searchQuery = ref('')
const showNotifPopup = ref(false)
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

function goBack() {
  router.back()
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

function isActiveRoute(itemRoute: string) {
  if (itemRoute === '/') return route.path === '/'
  return route.path.startsWith(itemRoute)
}

const selectedIds = ref<Set<string>>(new Set())
const selectAll = ref(false)

// ─── Lifecycle ────────────────────────────────────────────────────────────────
// Global listener handled in App.vue

// ─── Filtered Notifications ───────────────────────────────────────────────────
const filteredNotifications = computed(() => {
  if (!searchQuery.value) return notificationsStore.notifications
  const q = searchQuery.value.toLowerCase()
  return notificationsStore.notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.detail.toLowerCase().includes(q) ||
      n.typeLabel.toLowerCase().includes(q),
  )
})

// ─── Select / Deselect ────────────────────────────────────────────────────────
function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value) // trigger reactivity
  selectAll.value =
    selectedIds.value.size === filteredNotifications.value.length &&
    filteredNotifications.value.length > 0
}

function toggleSelectAll() {
  if (selectAll.value) {
    selectedIds.value = new Set(filteredNotifications.value.map((n) => n.id))
  } else {
    selectedIds.value = new Set()
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────
async function markSelectedAsRead() {
  const ids = Array.from(selectedIds.value)
  await notificationsStore.markMultipleAsRead(ids)
  selectedIds.value = new Set()
  selectAll.value = false
}

async function deleteSelected() {
  const ids = Array.from(selectedIds.value)
  await notificationsStore.deleteMultiple(ids)
  selectedIds.value = new Set()
  selectAll.value = false
}

const handleNotifClick = async (notif: any) => {
  try {
    if (!notif.read && !notif.is_read) {
      await notificationsStore.markAsRead(notif.id)
    }
  } catch (err) {
    console.warn('Failed to mark notification as read:', err)
  }

  // If the notification has a related entity (e.g., donation listing), navigate to it
  const relatedId = (notif as any).related_entity_id || (notif as any).relatedEntityId
  if (relatedId) {
    // Assuming a route that can display a donation listing, using query param
    router.push({ path: '/donations', query: { listing: relatedId } })
    return
  }

  const typeStr = (notif.type || '').toUpperCase()
  const msgStr = (notif.title || notif.message || notif.detail || '').toUpperCase()

  if (typeStr.includes('EXPIRY') || msgStr.includes('EXPIR')) {
    router.push('/inventory')
  } else if (typeStr.includes('DONATION') || msgStr.includes('DONAT')) {
    router.push('/donations')
  } else if (typeStr.includes('MEAL') || msgStr.includes('MEAL')) {
    router.push('/meal-plan')
  } else if (typeStr.includes('ACCOUNT') || msgStr.includes('ACCOUNT')) {
    router.push('/settings')
  } else {
    alert(
      `Debug - Unhandled Notification:\nType: ${notif.type}\nMessage: ${notif.title || notif.message || notif.detail}`,
    )
  }
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

.notifications-page {
  background: #eef2f8;
  font-family: 'Inter', sans-serif;
  color: #0a1c2f;
  min-height: 100vh;
  padding: 24px 20px;
}

.notifications-shell {
  max-width: 1760px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: clamp(18px, 2vw, 28px);
  align-items: start;
}

.main-content {
  min-width: 0;
}

/* ── Top Bar (legacy styles; replaced by BaseTopbar component) ── */
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

.page-title {
  font-size: 2.15rem;
  font-weight: 800;
  color: #0a1c2f;
}

.top-bar-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  flex: 1;
  min-width: min(100%, 420px);
  justify-content: flex-end;
}

/* ── Sleek Bulk Manage Bar ────────────────────────────────────────────────── */
.notif-manage-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  margin-bottom: 20px;
  backdrop-filter: blur(12px);
  gap: 12px;
  flex-wrap: wrap;
}

.manage-bar-left,
.manage-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.manage-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1.5px solid #deebe2;
  border-radius: 100px;
  padding: 8px 18px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(31, 47, 62, 0.03);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
}

.manage-pill-btn:hover {
  background: #f8fafc;
  border-color: #2c7a4d;
  color: #1b5e37;
  transform: translateY(-1px);
}

.manage-pill-btn.active {
  background: #eef7f1;
  border-color: #2c7a4d;
  color: #2c7a4d;
  box-shadow: 0 4px 12px rgba(44, 122, 77, 0.1);
}

.selected-count-badge {
  background: #2c7a4d;
  color: white;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 12px rgba(44, 122, 77, 0.25);
  animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.manage-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 100px;
  padding: 8px 16px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.manage-action-btn.danger {
  color: #ef4444;
  border-color: #fee2e2;
  background: #fff5f5;
}

.manage-action-btn.danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.12);
}

.manage-action-btn.success {
  color: #10b981;
  border-color: #d1fae5;
  background: #f0fdf4;
}

.manage-action-btn.success:hover {
  background: #ecfdf5;
  border-color: #a7f3d0;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.12);
}

/* Transitions & Keyframes */
@keyframes popIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}

/* ── Notification List ────────────────────────────────────────────────── */
.notif-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.notif-item {
  background: white;
  border-radius: 28px;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  box-shadow: 0 12px 30px rgba(31, 47, 62, 0.04);
  border: 1px solid #e8eef7;
  position: relative;
  transition:
    box-shadow 0.2s,
    border-color 0.2s;
}

.notif-item:hover {
  box-shadow: 0 16px 28px rgba(31, 47, 62, 0.07);
}

.notif-item.unread {
  border-left: 4px solid #2c7a4d;
  background: #f8fff9;
}

.notif-item.selected {
  border-color: #2c7a4d;
  background: #f0fdf4;
}

.notif-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #2c7a4d;
  margin-top: 2px;
  cursor: pointer;
  flex-shrink: 0;
}

.notif-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #e8f5e9;
  border: 2px solid #c8e6c9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.notif-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notif-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0a1c2f;
}

.notif-type {
  font-size: 0.78rem;
  font-weight: 600;
  color: #2c7a4d;
}

.notif-detail {
  font-size: 0.83rem;
  color: #577190;
  line-height: 1.5;
}

.notif-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.notif-date {
  font-size: 0.78rem;
  color: #7e95b0;
  white-space: nowrap;
}

.notif-time {
  font-size: 0.78rem;
  color: #9aafc4;
  white-space: nowrap;
}

.unread-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2c7a4d;
  flex-shrink: 0;
  margin-top: 4px;
}

.notif-empty {
  background: white;
  border-radius: 28px;
  padding: 60px 20px;
  text-align: center;
  color: #9aafc4;
  font-size: 1rem;
  box-shadow: 0 12px 30px rgba(31, 47, 62, 0.04);
  border: 1px solid #e8eef7;
}

.notif-empty i {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
  color: #7e95b0;
}

/* Mobile Bottom Navigation (Base Style) */
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

/* Custom Action Bar Items inside Top Bar Slot */
/* Manage Bar Responsive Styling */
@media (max-width: 640px) {
  .notif-manage-bar {
    padding: 8px 12px;
    border-radius: 18px;
    gap: 8px;
  }

  .manage-pill-btn {
    padding: 6px 14px;
    font-size: 0.78rem;
  }

  .manage-action-btn {
    padding: 6px 12px;
    font-size: 0.75rem;
  }
}

/* Responsive */
@media (max-width: 1120px) {
  .notifications-page {
    padding: 12px 12px 112px;
  }

  .notifications-shell {
    grid-template-columns: 1fr;
  }

  .mobile-bottom-nav {
    display: grid;
  }

  /* Hide the desktop sidebar on tablets/phones */
  .notifications-shell > :deep(.sidebar) {
    display: none;
  }

  .notif-header-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .notif-meta {
    align-items: flex-start;
    margin-top: 4px;
  }
}

@media (max-width: 640px) {
  .notif-item {
    padding: 16px;
    border-radius: 20px;
    gap: 12px;
  }

  .notif-icon {
    width: 44px;
    height: 44px;
    font-size: 1.2rem;
  }

  .notif-title {
    font-size: 0.88rem;
  }

  .notif-detail {
    font-size: 0.78rem;
  }
}
</style>
