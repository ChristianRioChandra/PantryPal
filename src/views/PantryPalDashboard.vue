<template>
  <div class="sp-wrap">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="logo">🌿 PantryPal</div>
      <nav>
        <div
          v-for="item in navItems"
          :key="item.label"
          class="nav-item"
          :class="{ active: item.active }"
          @click="setActiveNav(item.label)"
        >
          <span class="nav-dot"></span>
          {{ item.label }}
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main">
      <!-- Topbar -->
      <header class="topbar">
        <input
          type="search"
          placeholder="Search food, donations, meals..."
          class="form-control form-control-sm"
          style="max-width: 300px"
        />
        <div class="ms-auto d-flex gap-2">
          <button class="tb-btn position-relative">
            Notifications
            <span class="badge">2</span>
          </button>
          <button class="tb-btn">Settings</button>
          <button class="tb-btn">Log out</button>
        </div>
      </header>

      <!-- Dashboard Grid -->
      <div class="content container-fluid">
        <div class="row g-3">
          <!-- Welcome Card -->
          <div class="col-md-6">
            <div class="card welcome-card">
              <div class="welcome-name">Welcome back, Alex 👋</div>
              <div class="welcome-sub">You have 3 items expiring this week.</div>
            </div>
          </div>

          <!-- Expiry Alerts -->
          <div class="col-md-6">
            <div class="card alert-card">
              <div class="card-title">Expiry Alerts</div>
              <div class="alert-list">
                <div class="alert-item">⚠ Bread is about to expire — 1 day left</div>
                <div class="alert-item">⚠ Milk is about to expire — 2 days left</div>
              </div>
            </div>
          </div>

          <!-- Inventory Card -->
          <div class="col-md-6">
            <div class="card inv-card">
              <div class="card-title">Inventory</div>
              <div v-for="item in inventoryItems" :key="item.id" class="inv-item">
                <div class="inv-icon">{{ item.icon }}</div>
                <div class="inv-info">
                  <div class="inv-name">{{ item.name }}</div>
                  <div class="inv-sub">{{ item.location }} · Exp: {{ item.expiry }}</div>
                </div>
                <span class="inv-tag" :class="{ warn: item.warning }">{{ item.tag }}</span>
              </div>
              <button class="manage-btn">Manage Inventory →</button>
            </div>
          </div>

          <!-- Meal Plan Card -->
          <div class="col-md-6">
            <div class="card meal-card">
              <div class="card-title">This Week's Meal Plan</div>
              <div class="meal-nav">
                <button class="meal-nav-btn">‹</button>
                <span class="meal-day-title">Monday, 14 Apr</span>
                <button class="meal-nav-btn">›</button>
              </div>
              <div class="meal-slot">
                <div class="meal-slot-label">Breakfast</div>
                <div class="meal-slot-name">Cereal with Milk</div>
              </div>
              <div class="meal-slot">
                <div class="meal-slot-label">Lunch</div>
                <div class="meal-slot-empty">Not planned yet</div>
              </div>
              <div class="meal-slot">
                <div class="meal-slot-label">Dinner</div>
                <div class="meal-slot-name">Shrimp Fried Rice</div>
              </div>
              <button class="manage-btn">Manage Plan →</button>
            </div>
          </div>

          <!-- Recommendations -->
          <div class="col-md-6">
            <div class="card reco-card">
              <div class="card-title">Recommendation · Try Out</div>
              <div class="reco-label">Based on expiring items</div>
              <div class="reco-item">Rendang — uses beef, coconut milk</div>
              <div class="reco-item">Milk Pudding — uses milk, sugar</div>
            </div>
          </div>

          <!-- Food Saved Progress -->
          <div class="col-md-6">
            <div class="card">
              <div class="card-title">Food Saved This Month</div>
              <div class="saved-bar-wrap">
                <div class="saved-label">
                  <span>Progress</span>
                  <span style="color: #1d9e75; font-weight: 500">65%</span>
                </div>
                <div class="saved-bar">
                  <div class="saved-fill" style="width: 65%"></div>
                </div>
              </div>
              <div style="margin-top: 0.75rem; font-size: 12px; color: var(--color-text-secondary)">
                13 of 20 items used or donated before expiry
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface NavItem {
  label: string
  active: boolean
}

interface InventoryItem {
  id: number
  icon: string
  name: string
  location: string
  expiry: string
  tag: string
  warning?: boolean
}

const navItems = ref<NavItem[]>([
  { label: 'Dashboard', active: true },
  { label: 'Inventory', active: false },
  { label: 'Meal Plan', active: false },
  { label: 'Donation', active: false },
  { label: 'Analytics', active: false },
  { label: 'Settings', active: false },
])

const inventoryItems = ref<InventoryItem[]>([
  {
    id: 1,
    icon: '🥛',
    name: 'UltraMilk · 500ml Original',
    location: 'Fridge',
    expiry: '6 Apr 2026',
    tag: '2d left',
    warning: true,
  },
  {
    id: 2,
    icon: '🍳',
    name: 'Shrimp Fried Rice',
    location: 'Freezer',
    expiry: '20 Apr 2026',
    tag: 'Fresh',
  },
  {
    id: 3,
    icon: '🍗',
    name: 'Chicken Nuggets',
    location: 'Freezer',
    expiry: '25 Apr 2026',
    tag: 'Fresh',
  },
])

const setActiveNav = (label: string) => {
  navItems.value.forEach((item) => (item.active = item.label === label))
  // In a real app, you'd also use vue-router here
}
</script>

<style scoped>
/* Import global variables */
@import '../assets/variables.css';

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.sp-wrap {
  display: flex;
  min-height: 100vh;
  background: var(--color-background-tertiary);
}

.sidebar {
  width: 180px;
  min-width: 180px;
  background: var(--color-background-primary);
  border-right: 0.5px solid var(--color-border-tertiary);
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
}

.sidebar .logo {
  padding: 0.5rem 1rem 1.5rem;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  border-bottom: 0.5px solid var(--color-border-tertiary);
  margin-bottom: 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.5rem 1rem;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s;
}

.nav-item:hover {
  background: var(--color-background-secondary);
}

.nav-item.active {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  font-weight: 500;
}

.nav-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-border-secondary);
  flex-shrink: 0;
}

.nav-item.active .nav-dot {
  background: #1d9e75;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  background: var(--color-background-primary);
  border-bottom: 0.5px solid var(--color-border-tertiary);
  padding: 0.6rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar input {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 0.5px solid var(--color-border-tertiary);
}

.tb-btn {
  padding: 5px 12px;
  font-size: 12px;
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  background: var(--color-background-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  position: relative;
}

.tb-btn .badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background: #d85a30;
  border-radius: 50%;
  font-size: 10px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  padding: 1.25rem;
  overflow-y: auto;
}

/* Cards */
.card {
  background: var(--color-background-primary);
  border: 0.5px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-lg);
  padding: 1rem 1.25rem;
  height: 100%;
}

.card-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.welcome-name {
  font-size: 22px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.welcome-sub {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
  padding: 6px 8px;
  background: var(--color-background-warning);
  border-radius: var(--border-radius-md);
  border-left: 3px solid #ef9f27;
}

.inv-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 0.5px solid var(--color-border-tertiary);
}

.inv-item:last-of-type {
  border-bottom: none;
}

.inv-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-md);
  background: var(--color-background-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.inv-info {
  flex: 1;
}

.inv-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.inv-sub {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.inv-tag {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 20px;
  background: #e1f5ee;
  color: #0f6e56;
  font-weight: 500;
}

.inv-tag.warn {
  background: #faeeda;
  color: #854f0b;
}

.manage-btn {
  display: block;
  width: 100%;
  margin-top: 0.75rem;
  padding: 7px;
  font-size: 12px;
  text-align: center;
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.reco-item {
  padding: 8px;
  border: 0.5px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-md);
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.reco-label {
  font-size: 10px;
  color: var(--color-text-tertiary);
  margin-bottom: 2px;
}

.meal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.meal-nav-btn {
  background: none;
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.meal-day-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.meal-slot {
  padding: 7px 0;
  border-bottom: 0.5px solid var(--color-border-tertiary);
}

.meal-slot:last-child {
  border-bottom: none;
}

.meal-slot-label {
  font-size: 10px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 3px;
}

.meal-slot-name {
  font-size: 13px;
  color: var(--color-text-primary);
}

.meal-slot-empty {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-style: italic;
}

.saved-bar-wrap {
  margin-top: 0.5rem;
}

.saved-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
}

.saved-bar {
  height: 12px;
  background: var(--color-background-secondary);
  border-radius: 20px;
  overflow: hidden;
}

.saved-fill {
  height: 100%;
  background: #1d9e75;
  border-radius: 20px;
}
</style>
