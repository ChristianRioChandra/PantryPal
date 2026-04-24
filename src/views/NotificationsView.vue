<template>
  <div class="notifications-page">
    <div class="notifications-shell">
      <BaseSidebar :nav-items="navItems" />

      <div class="main-content">
        <!-- Top Bar -->
        <div class="top-bar">
          <h2 class="page-title">Notifications</h2>
          <div class="top-bar-actions">
            <label class="select-all-wrap">
              <span>Select All</span>
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
            </label>
            <button class="action-icon-btn danger" @click="deleteSelected" title="Delete selected">
              <i class="bi bi-trash"></i>
              <span>Delete</span>
            </button>
            <button class="action-icon-btn" @click="markSelectedAsRead" title="Mark as read">
              <i class="bi bi-check2-all"></i>
              <span>Read</span>
            </button>
          </div>
        </div>

        <!-- Notification List -->
        <div class="notif-list">
          <!-- Empty State -->
          <div v-if="notifications.length === 0" class="notif-empty">
            <i class="bi bi-bell-slash"></i>
            <p>No notifications yet.</p>
          </div>

          <!-- Notification Item -->
          <div
            v-for="notif in notifications"
            :key="notif.id"
            class="notif-item"
            :class="{ unread: !notif.read, selected: selectedIds.has(notif.id) }"
          >
            <!-- Checkbox -->
            <input
              type="checkbox"
              class="notif-checkbox"
              :checked="selectedIds.has(notif.id)"
              @change="toggleSelect(notif.id)"
            />

            <!-- Icon -->
            <div class="notif-icon">{{ notif.icon }}</div>

            <!-- Body -->
            <div class="notif-body">
              <div class="notif-header-row">
                <div class="notif-title-block">
                  <span class="notif-title">{{ notif.title }}</span>
                  <span class="notif-type">{{ notif.type }}</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseSidebar from '@/components/BaseSidebar.vue'
import type { NavItem } from '@/components/BaseSidebar.vue'

const router = useRouter()

const navItems: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'bi bi-graph-up' },
  { label: 'Inventory', route: '/inventory', icon: 'bi bi-box-seam' },
  { label: 'Meal Plan', route: '/meal-plan', icon: 'bi bi-calendar' },
  { label: 'Donation', route: '/donations', icon: 'bi bi-heart' },
  { label: 'Analytics', route: '/analytics', icon: 'bi bi-pie-chart' },
  { label: 'Settings', route: '/settings', icon: 'bi bi-gear' },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface NotifItem {
  id: number
  icon: string
  title: string
  type: string
  detail: string
  date: string
  time: string
  read: boolean
}

// ─── State ────────────────────────────────────────────────────────────────────
const notifications = ref<NotifItem[]>([
  {
    id: 1,
    icon: '🥛',
    title: 'Ultra Milk : 500Ml Original, About to Expire Soon',
    type: 'Expiry Notification',
    detail: 'Hurry, Use or donate Ultra Milk : 500Ml Original Before it Spoils',
    date: 'Saturday, 4 April 2026',
    time: '09:30 AM',
    read: false,
  },
  {
    id: 2,
    icon: '👤',
    title: 'John Doe Interested in your Food Item',
    type: 'Donation Request',
    detail: 'I would love to contact you, regarding your food Item : Ultra Milk : 500Ml Original',
    date: 'Saturday, 4 April 2026',
    time: '09:30 AM',
    read: false,
  },
  {
    id: 3,
    icon: '🍞',
    title: 'Bread : 300g, About to Expire Soon',
    type: 'Expiry Notification',
    detail: 'Hurry, Use or donate Bread : 300g Before it Spoils',
    date: 'Friday, 3 April 2026',
    time: '08:00 AM',
    read: true,
  },
])

const selectedIds = ref<Set<number>>(new Set())
const selectAll = ref(false)

// ─── Select / Deselect ────────────────────────────────────────────────────────
function toggleSelect(id: number) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value) // trigger reactivity
  selectAll.value = selectedIds.value.size === notifications.value.length
}

function toggleSelectAll() {
  if (selectAll.value) {
    selectedIds.value = new Set(notifications.value.map((n) => n.id))
  } else {
    selectedIds.value = new Set()
  }
}

// Keep selectAll in sync when items change
watch(
  notifications,
  () => {
    if (selectedIds.value.size === 0) selectAll.value = false
  },
  { deep: true },
)

// ─── Actions ──────────────────────────────────────────────────────────────────
function markSelectedAsRead() {
  notifications.value.forEach((n) => {
    if (selectedIds.value.has(n.id)) n.read = true
  })
  selectedIds.value = new Set()
  selectAll.value = false
}

function deleteSelected() {
  notifications.value = notifications.value.filter((n) => !selectedIds.value.has(n.id))
  selectedIds.value = new Set()
  selectAll.value = false
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
  grid-template-columns: clamp(220px, 16vw, 256px) minmax(0, 1fr);
  gap: clamp(18px, 2vw, 28px);
  align-items: start;
}

.main-content {
  min-width: 0;
}

/* ── Top Bar ──────────────────────────────────────────────────────────────── */
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

/* ── Select All Checkbox ──────────────────────────────────────────────────── */
.select-all-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #3a5068;
  cursor: pointer;
  white-space: nowrap;
}

.select-all-wrap input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #2c7a4d;
  cursor: pointer;
}

/* ── Action Buttons ───────────────────────────────────────────────────────── */
.action-icon-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1.5px solid #e2e8f0;
  background: white;
  font-size: 0.82rem;
  font-weight: 600;
  color: #3a5068;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.action-icon-btn:hover {
  background: #f1f5f9;
}

.action-icon-btn.danger {
  color: #dc2626;
  border-color: #fecaca;
}

.action-icon-btn.danger:hover {
  background: #fef2f2;
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

/* Responsive */
@media (max-width: 920px) {
  .notifications-shell {
    grid-template-columns: 1fr;
  }

  .notif-header-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .notif-meta {
    align-items: flex-start;
  }

  .page-title {
    font-size: 1.8rem;
  }

  .top-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .top-bar-actions {
    justify-content: flex-start;
    min-width: 100%;
  }
}
</style>
