<template>
  <div class="weekly-meal-page">
    <div class="dashboard">
      <BaseSidebar :nav-items="navItems" />

      <div class="main-content">
        <BaseTopbar2
          title="Meal Plan"
          search-placeholder="Search meals or ingredients..."
          v-model:search-value="mealSearch"
        >
          <template #actions>
            <i class="bi bi-bell"></i>
            <i class="bi bi-gear"></i>
            <i class="bi bi-box-arrow-right"></i>
          </template>
        </BaseTopbar2>

        <!-- Content Grid -->
        <div class="content-grid">
          <!-- Calendar Card -->
          <div class="dashboard-card cal-card">
            <div class="card-header">
              <i class="bi bi-calendar3"></i>
              <span>Calendar</span>
            </div>
            <div class="cal-header">
              <button class="cal-nav" @click="prevMonth"><i class="bi bi-chevron-left"></i></button>
              <span class="cal-month">{{ currentMonthYear }}</span>
              <button class="cal-nav" @click="nextMonth">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
            <div class="cal-grid">
              <div v-for="day in dayLabels" :key="day" class="cal-day-label">{{ day }}</div>
              <div
                v-for="day in calendarDays"
                :key="day.dateKey"
                class="cal-day"
                :class="{
                  'other-month': !day.isCurrentMonth,
                  today: day.isToday,
                  selected: day.isSelected,
                }"
                @click="selectDate(day.date)"
              >
                {{ day.dayOfMonth }}
              </div>
            </div>
          </div>

          <!-- Meal Detail Card -->
          <div class="dashboard-card meal-detail-card">
            <div class="card-header">
              <i class="bi bi-card-list"></i>
              <span>{{ formattedSelectedDate }}</span>
            </div>
            <div v-for="slot in mealSlots" :key="slot.type" class="meal-slot">
              <div class="meal-slot-header">{{ slot.label }}</div>
              <div class="meal-slot-body">
                <span v-if="slot.meal" class="meal-name">{{ slot.meal }}</span>
                <span v-else class="meal-empty">Not planned yet</span>
                <button class="meal-edit-btn">
                  {{ slot.meal ? 'Edit' : '+ Add' }}
                </button>
              </div>
            </div>
            <div class="meal-actions">
              <button class="card-action-btn">Create Meal</button>
              <button class="card-action-btn primary">Browse Recommendations</button>
            </div>
            <button class="save-btn">Save Plan</button>
          </div>

          <!-- Inventory Card -->
          <div class="dashboard-card inv-card">
            <div class="card-header">
              <i class="bi bi-box-seam"></i>
              <span>Inventory</span>
            </div>
            <div class="inv-search-row">
              <input
                v-model="inventorySearch"
                placeholder="Search items..."
                class="form-control form-control-sm"
              />
              <button class="filter-btn-sm">Filter</button>
            </div>
            <div class="inventory-list">
              <div v-for="item in filteredInventory" :key="item.id" class="inventory-item">
                <div class="inv-icon">{{ item.icon }}</div>
                <div class="inv-info">
                  <div class="inv-name">{{ item.name }}</div>
                  <div class="inv-sub">{{ item.location }} · Exp: {{ item.expiry }}</div>
                </div>
                <span v-if="item.warning" class="inv-tag warn">{{ item.tag }}</span>
                <button class="inv-add-btn">Add</button>
              </div>
            </div>
          </div>

          <!-- Create Meal & Recommendations -->
          <div class="create-card">
            <div class="dashboard-card">
              <div class="card-header">
                <i class="bi bi-plus-circle"></i>
                <span>Create New Meal</span>
              </div>
              <div class="form-field">
                <label>Meal name</label>
                <input v-model="newMealName" placeholder="e.g. Nasi Goreng" class="form-control" />
              </div>
              <div class="form-field">
                <label>Ingredients used</label>
                <div v-for="(ing, idx) in selectedIngredients" :key="idx" class="ingr-item">
                  {{ ing.icon }} {{ ing.name }}
                  <span class="remove-ingr" @click="removeIngredient(idx)">✕</span>
                </div>
                <div class="add-ingr" @click="showIngredientSelector = true">+ Add ingredients</div>
              </div>
              <button class="card-action-btn primary" @click="addMeal">Add Meal</button>
            </div>

            <div class="dashboard-card">
              <div class="card-header">
                <i class="bi bi-lightbulb"></i>
                <span>Recommendations</span>
              </div>
              <div v-for="rec in recommendations" :key="rec.id" class="reco-item">
                <div class="reco-icon">{{ rec.icon }}</div>
                <div class="reco-info">
                  <div class="reco-name">{{ rec.name }}</div>
                  <div class="reco-sub">Uses: {{ rec.uses }}</div>
                </div>
                <button class="reco-add">+ Plan</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BaseRightSidebar
        quick-actions-title="Meal Actions"
        :total-items="inventoryItems.length"
        :expiring-soon="inventoryItems.filter((i) => i.warning).length"
      >
        <template #quick-actions>
          <button class="right-btn"><i class="bi bi-calendar-plus"></i> Plan Week</button>
          <button class="right-btn"><i class="bi bi-cart"></i> Shopping List</button>
          <button class="right-btn"><i class="bi bi-star"></i> Favorite Meals</button>
        </template>
      </BaseRightSidebar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseSidebar from '@/components/BaseSidebar.vue'
import BaseTopbar2 from '@/components/BaseTopbar2.vue'
import BaseRightSidebar from '@/components/BaseRightSidebar.vue'
import type { NavItem } from '@/components/BaseSidebar.vue'

interface InventoryItem {
  id: number
  icon: string
  name: string
  location: string
  expiry: string
  tag?: string
  warning?: boolean
}

interface Recommendation {
  id: number
  icon: string
  name: string
  uses: string
}

// Calendar state
const currentDate = ref(new Date(2026, 3, 14)) // April 14, 2026 (month index 3)
const selectedDate = ref(new Date(2026, 3, 14))

const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
})

interface CalendarDay {
  date: Date
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  dateKey: string
}

const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDayOfWeek = firstDay.getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: CalendarDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Previous month days
  const prevMonthDate = new Date(year, month, 0)
  const daysInPrevMonth = prevMonthDate.getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, daysInPrevMonth - i)
    days.push({
      date,
      dayOfMonth: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      isSelected: date.getTime() === selectedDate.value.getTime(),
      dateKey: date.toISOString(),
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    days.push({
      date,
      dayOfMonth: d,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      isSelected: date.getTime() === selectedDate.value.getTime(),
      dateKey: date.toISOString(),
    })
  }

  // Next month days to fill 42 cells (6 rows)
  const remainingCells = 42 - days.length
  for (let d = 1; d <= remainingCells; d++) {
    const date = new Date(year, month + 1, d)
    days.push({
      date,
      dayOfMonth: d,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      isSelected: date.getTime() === selectedDate.value.getTime(),
      dateKey: date.toISOString(),
    })
  }

  return days
})

const formattedSelectedDate = computed(() => {
  return selectedDate.value.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const selectDate = (date: Date) => {
  selectedDate.value = new Date(date)
  selectedDate.value.setHours(0, 0, 0, 0)
}

// Meal slots for selected date
const mealSlots = ref([
  { type: 'breakfast', label: 'Breakfast', meal: 'Cereal with UltraMilk' },
  { type: 'lunch', label: 'Lunch', meal: 'Chicken Wings' },
  { type: 'dinner', label: 'Dinner', meal: 'Chicken Katsu' },
  { type: 'snacks', label: 'Snacks', meal: '' },
])

// Inventory
const inventorySearch = ref('')
const inventoryItems = ref<InventoryItem[]>([
  {
    id: 1,
    icon: '🥛',
    name: 'UltraMilk · 500ml Original',
    location: 'Fridge',
    expiry: '6 Apr 2026',
    tag: '2d',
    warning: true,
  },
  {
    id: 2,
    icon: '🍞',
    name: 'Loaf of Bread · 300g',
    location: 'Pantry',
    expiry: '18 Apr 2026',
  },
  {
    id: 3,
    icon: '🍚',
    name: 'Leftover Rice',
    location: 'Fridge',
    expiry: '18 Apr 2026',
  },
  {
    id: 4,
    icon: '🥚',
    name: 'Eggs · 6 pcs',
    location: 'Fridge',
    expiry: '25 Apr 2026',
  },
])

const filteredInventory = computed(() => {
  if (!inventorySearch.value) return inventoryItems.value
  const q = inventorySearch.value.toLowerCase()
  return inventoryItems.value.filter(
    (item) => item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q),
  )
})

// Create meal form
const newMealName = ref('')
const selectedIngredients = ref<{ icon: string; name: string }[]>([
  { icon: '🥛', name: 'UltraMilk · 500ml Original' },
  { icon: '🍞', name: 'Loaf of Bread · 300g' },
])
const showIngredientSelector = ref(false)

const removeIngredient = (index: number) => {
  selectedIngredients.value.splice(index, 1)
}

const addMeal = () => {
  // In a real app, this would save to Firestore
  alert(`Meal "${newMealName.value}" added!`)
  newMealName.value = ''
  selectedIngredients.value = []
}

// Recommendations
const recommendations = ref<Recommendation[]>([
  {
    id: 1,
    icon: '🍛',
    name: 'Nasi Goreng',
    uses: 'Rice, Eggs, Chicken',
  },
  {
    id: 2,
    icon: '🍜',
    name: 'Mie Goreng',
    uses: 'Noodles, Eggs, Veggies',
  },
  {
    id: 3,
    icon: '🥞',
    name: 'Milk Pancakes',
    uses: 'UltraMilk, Eggs, Flour',
  },
])

// Make sure to define navItems with icons or without (use nav-dot)
const navItems: NavItem[] = [
  { label: 'Dashboard', route: '/', icon: 'bi bi-graph-up' },
  { label: 'Inventory', route: '/inventory', icon: 'bi bi-box-seam' },
  { label: 'Meal Plan', route: '/meal-plan', icon: 'bi bi-calendar' },
  { label: 'Donation', route: '/donations', icon: 'bi bi-heart' },
  { label: 'Analytics', route: '/analytics', icon: 'bi bi-pie-chart' },
  { label: 'Settings', route: '/settings', icon: 'bi bi-gear' },
]

const mealSearch = ref('')
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.sidebar {
  background: white;
  border-radius: 34px;
  box-shadow: 0 18px 45px rgba(31, 47, 62, 0.06);
  padding: 34px 24px 26px;
  position: sticky;
  top: 24px;
}

.weekly-meal-page {
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
  grid-template-columns: clamp(220px, 16vw, 256px) minmax(0, 1fr) clamp(232px, 18vw, 276px);
  gap: clamp(18px, 2vw, 28px);
  align-items: start;
}

.main-content {
  min-width: 0;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  grid-template-rows: auto auto;
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

/* Calendar specific */
.cal-card {
  grid-column: 1/2;
  grid-row: 1/2;
}
.meal-detail-card {
  grid-column: 2/3;
  grid-row: 1/2;
}
.inv-card {
  grid-column: 1/2;
  grid-row: 2/3;
}
.create-card {
  grid-column: 2/3;
  grid-row: 2/3;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Adapt existing calendar/meal styles to match dashboard card aesthetic */
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}
.cal-nav {
  background: #f3f6fb;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  cursor: pointer;
  color: #5f7f9e;
}
.cal-month {
  font-weight: 600;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-day-label {
  text-align: center;
  font-size: 0.7rem;
  color: #7e95b0;
  padding: 4px 0;
}
.cal-day {
  text-align: center;
  font-size: 0.85rem;
  padding: 6px 0;
  border-radius: 8px;
  cursor: pointer;
}
.cal-day:hover {
  background: #f3f6fb;
}
.cal-day.today {
  background: #2c7a4d;
  color: white;
}
.cal-day.selected {
  background: #e1f5ee;
  color: #0f6e56;
  font-weight: 600;
}
.cal-day.other-month {
  color: #b0c4de;
}

.meal-slot {
  border: 1px solid #e8eef7;
  border-radius: 16px;
  margin-bottom: 12px;
  overflow: hidden;
}
.meal-slot-header {
  background: #f8fafc;
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #577190;
}
.meal-slot-body {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.meal-name {
  font-weight: 500;
}
.meal-empty {
  color: #9aafc4;
  font-style: italic;
}
.meal-edit-btn {
  background: none;
  border: 1px solid #e2e8f0;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  cursor: pointer;
}
.meal-actions {
  display: flex;
  gap: 10px;
  margin: 16px 0;
}
.save-btn {
  width: 100%;
  background: #2c7a4d;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
}

.inv-search-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.inv-search-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 40px;
  background: #f8fafc;
}
.filter-btn-sm {
  padding: 8px 14px;
  background: #f3f6fb;
  border: none;
  border-radius: 40px;
  font-weight: 500;
  cursor: pointer;
}

.inventory-list {
  max-height: 300px;
  overflow-y: auto;
}
.inventory-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #edf2f7;
}
.inv-icon {
  width: 36px;
  height: 36px;
  background: #f3f6fb;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.inv-info {
  flex: 1;
}
.inv-name {
  font-weight: 600;
  font-size: 0.9rem;
}
.inv-sub {
  font-size: 0.75rem;
  color: #6883a8;
}
.inv-tag {
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 20px;
  background: #dcfce7;
  color: #166534;
}
.inv-tag.warn {
  background: #fef3c7;
  color: #92400e;
}
.inv-add-btn {
  font-size: 0.7rem;
  padding: 4px 8px;
  border: 1px solid #2c7a4d;
  border-radius: 20px;
  color: #2c7a4d;
  background: none;
  cursor: pointer;
}

.form-field {
  margin-bottom: 16px;
}
.form-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #48617c;
  margin-bottom: 4px;
}
.form-field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
}
.ingr-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f3f6fb;
  border-radius: 12px;
  margin-bottom: 6px;
}
.remove-ingr {
  margin-left: auto;
  color: #d85a30;
  cursor: pointer;
}
.add-ingr {
  color: #2c7a4d;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
}

.reco-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 16px;
  margin-bottom: 8px;
}
.reco-icon {
  width: 40px;
  height: 40px;
  background: #e1f5ee;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}
.reco-info {
  flex: 1;
}
.reco-name {
  font-weight: 600;
}
.reco-sub {
  font-size: 0.75rem;
  color: #6883a8;
}
.reco-add {
  padding: 4px 10px;
  border: 1px solid #2c7a4d;
  border-radius: 20px;
  color: #2c7a4d;
  background: none;
  cursor: pointer;
  font-size: 0.75rem;
}

.card-action-btn {
  padding: 10px 16px;
  background: #f3f6fb;
  border: none;
  border-radius: 40px;
  font-weight: 600;
  color: #2c3e4e;
  cursor: pointer;
  flex: 1;
}
.card-action-btn.primary {
  background: #2c7a4d;
  color: white;
}

/* Responsive adjustments */
@media (max-width: 1120px) {
  .dashboard {
    grid-template-columns: 232px minmax(0, 1fr);
  }
  .right-sidebar {
    grid-column: 1 / -1;
    position: static;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}
@media (max-width: 920px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
  .content-grid {
    grid-template-columns: 1fr;
  }
  .cal-card,
  .meal-detail-card,
  .inv-card,
  .create-card {
    grid-column: auto;
    grid-row: auto;
  }
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
</style>
