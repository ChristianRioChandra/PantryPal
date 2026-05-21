<template>
  <div class="weekly-meal-page">
    <div class="dashboard">
      <BaseSidebar :nav-items="navItems" />

      <div class="main-content">
        <BaseTopbar
          title="Meal Plan"
          search-placeholder="Search meals or ingredients..."
          v-model:search-value="mealSearch"
        />

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
                <button v-if="slot.meal" class="meal-edit-btn" @click="openMealEdit(slot.type)">
                  Edit
                </button>
              </div>
            </div>
            <div class="meal-actions">
              <button class="card-action-btn secondary" @click="openCreateMealPanel">
                Create Meal
              </button>
            </div>
            <button class="save-btn" @click="saveMealPlan">Save Plan</button>
          </div>

          <!-- Create Meal & Recommendations (shown as popup) -->
          <Transition name="modal-fade">
            <div
              v-if="showCreateMealPanel"
              class="modal-overlay"
              @click.self="closeCreateMealPanel"
            >
              <div class="modal-content-container">
                <div class="modal-box modal-create-meal premium-glass">
                  <div class="create-meal-modal-header">
                    <div class="create-meal-modal-title">
                      <div class="title-icon">
                        <i class="bi bi-plus-circle-fill"></i>
                      </div>
                      <div class="title-text">
                        <h3>Create Meal</h3>
                        <span>& Recommendations</span>
                      </div>
                    </div>
                    <button
                      class="modal-close-btn"
                      @click="closeCreateMealPanel"
                      aria-label="Close"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>

                  <div class="modal-body-grid">
                    <!-- Left Column: Create Form -->
                    <div class="create-form-section">
                      <div class="section-label">NEW MEAL DETAILS</div>

                      <div class="form-field-group">
                        <label>Meal Name</label>
                        <div class="input-wrapper">
                          <i class="bi bi-pencil-square"></i>
                          <input
                            v-model="newMealName"
                            placeholder="e.g. Nasi Goreng Special"
                            class="premium-input"
                          />
                        </div>
                      </div>

                      <div class="form-field-group">
                        <label>Ingredients Used</label>
                        <div class="ingredients-list-container">
                          <TransitionGroup name="list" tag="div" class="ingredients-chips">
                            <div
                              v-for="(ing, idx) in selectedIngredients"
                              :key="ing.name"
                              class="ingredient-chip"
                            >
                              <span class="chip-icon">{{ ing.icon }}</span>
                              <span class="chip-name">{{ ing.name }}</span>
                              <button class="remove-chip" @click="removeIngredient(idx)">
                                <i class="bi bi-x"></i>
                              </button>
                            </div>
                          </TransitionGroup>
                          <button class="add-ingredient-trigger" @click="openIngredientSelector">
                            <i class="bi bi-plus-lg"></i>
                            <span>Add from Inventory</span>
                          </button>
                        </div>
                      </div>

                      <div class="form-field-group">
                        <label>Assign to Slot</label>
                        <div class="select-wrapper">
                          <i class="bi bi-clock-history"></i>
                          <select v-model="selectedMealSlotForNewMeal" class="premium-select">
                            <option v-for="slot in mealSlots" :key="slot.type" :value="slot.type">
                              {{ slot.label }} {{ slot.meal ? `(Current: ${slot.meal})` : '' }}
                            </option>
                          </select>
                        </div>
                      </div>

                      <button class="btn-primary-glow" @click="addMealToPlan">
                        <i class="bi bi-calendar-check"></i>
                        Add to Daily Plan
                      </button>
                    </div>

                    <!-- Vertical Divider -->
                    <div class="modal-divider"></div>

                    <!-- Right Column: Recommendations -->
                    <div class="recommendations-section">
                      <div class="section-header">
                        <div class="section-label">AI RECOMMENDATIONS</div>
                        <span class="reco-count">{{ recommendations.length }} items</span>
                      </div>

                      <div class="recommendations-scroll">
                        <div v-for="rec in recommendations" :key="rec.id" class="premium-reco-card">
                          <div class="reco-visual">
                            <span class="reco-emoji">{{ rec.icon }}</span>
                          </div>
                          <div class="reco-details">
                            <div class="reco-top">
                              <span class="reco-name">{{ rec.name }}</span>
                              <button
                                class="reco-add-btn"
                                @click="planRecommendation(rec)"
                                title="Add to plan"
                              >
                                <i class="bi bi-plus"></i>
                              </button>
                            </div>
                            <div class="reco-ingredients">
                              <i class="bi bi-info-circle"></i>
                              <span>Uses: {{ rec.uses }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <BaseRightSidebar
        quick-actions-title="Meal Actions"
        :total-items="inventoryItems.length"
        :expiring-soon="inventoryItems.filter((i) => i.warning).length"
      >
        <template #quick-actions>
          <button class="right-btn" @click="planWeekNavigate">
            <i class="bi bi-calendar-plus"></i> Plan Week
          </button>
          <button class="right-btn" @click="shoppingListNavigate">
            <i class="bi bi-cart"></i> Shopping List
          </button>
          <button class="right-btn" @click="favoriteMealsNavigate">
            <i class="bi bi-star"></i> Favorite Meals
          </button>
        </template>
      </BaseRightSidebar>
    </div>

    <!-- Ingredient Selector Modal -->
    <Transition name="modal-fade">
      <div
        v-if="showIngredientSelector"
        class="modal-overlay"
        @click.self="closeIngredientSelector"
      >
        <div class="modal-content-container" style="max-width: 500px">
          <div class="modal-box premium-glass">
            <div class="create-meal-modal-header">
              <div class="create-meal-modal-title">
                <div class="title-icon">
                  <i class="bi bi-box-seam-fill"></i>
                </div>
                <div class="title-text">
                  <h3>Select Ingredients</h3>
                  <span>Your Inventory</span>
                </div>
              </div>
              <button class="modal-close-btn" @click="closeIngredientSelector">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <div class="modal-body-simple">
              <div class="inv-search-row">
                <div class="input-wrapper">
                  <i class="bi bi-search"></i>
                  <input
                    v-model="ingredientSearch"
                    placeholder="Search inventory..."
                    class="premium-input"
                  />
                </div>
              </div>

              <div class="inventory-list-scroll">
                <div
                  v-for="item in filteredInventoryForModal"
                  :key="item.id"
                  class="premium-inventory-item"
                  :class="{ selected: isIngredientSelected(item) }"
                  @click="toggleIngredientSelection(item)"
                >
                  <div class="inv-icon-box">{{ item.icon }}</div>
                  <div class="inv-info">
                    <div class="inv-name">{{ item.name }}</div>
                    <div class="inv-sub">{{ item.location }}</div>
                  </div>
                  <div class="checkbox-wrapper">
                    <div class="custom-checkbox" :class="{ checked: isIngredientSelected(item) }">
                      <i v-if="isIngredientSelected(item)" class="bi bi-check-lg"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="modal-btn-secondary" @click="closeIngredientSelector">Cancel</button>
              <button class="modal-btn-primary" @click="confirmIngredientSelection">
                Add Selected
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Meal Edit Modal -->
    <Transition name="modal-fade">
      <div v-if="editingMealSlot" class="modal-overlay" @click.self="closeMealEdit">
        <div class="modal-content-container" style="max-width: 450px">
          <div class="modal-box premium-glass">
            <div class="create-meal-modal-header">
              <div class="create-meal-modal-title">
                <div class="title-icon">
                  <i class="bi bi-pencil-fill"></i>
                </div>
                <div class="title-text">
                  <h3>Edit {{ editingMealSlotLabel }}</h3>
                  <span>Update your plan</span>
                </div>
              </div>
              <button class="modal-close-btn" @click="closeMealEdit">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <div class="modal-body-simple">
              <div class="form-field-group">
                <label>Meal Name</label>
                <div class="input-wrapper">
                  <i class="bi bi-egg-fried"></i>
                  <input
                    v-model="editingMealName"
                    class="premium-input"
                    placeholder="Enter meal name..."
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="modal-btn-secondary" @click="closeMealEdit">Cancel</button>
              <button class="modal-btn-primary" @click="saveMealEdit">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import BaseSidebar from '@/components/BaseSidebar.vue'
import BaseTopbar from '@/components/BaseTopbar.vue'
import BaseRightSidebar from '@/components/BaseRightSidebar.vue'
import type { NavItem } from '@/components/BaseSidebar.vue'
import { auth } from '@/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { getUserFoodItems, type FoodItem } from '@/services/foodService'
import {
  getMealPlanByDate,
  getMealPlanItems,
  saveDailyMealPlan,
  type MealTypeValue,
} from '@/services/mealPlanService'

// Types
interface InventoryItem {
  id: string
  icon: string
  name: string
  location: string
  expiry: string
  expiryDate: Date
  tag?: string
  warning?: boolean
}

interface Recommendation {
  id: number
  icon: string
  name: string
  uses: string
}

interface MealSlot {
  type: MealTypeValue
  label: string
  meal: string
  ingredientIds: string[]
}

interface SelectedIngredient {
  id: string
  icon: string
  name: string
}

// Navigation
const navItems: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'bi bi-graph-up' },
  { label: 'Inventory', route: '/inventory', icon: 'bi bi-box-seam' },
  { label: 'Meal Plan', route: '/meal-plan', icon: 'bi bi-calendar' },
  { label: 'Donation', route: '/donations', icon: 'bi bi-heart' },
  { label: 'Analytics', route: '/analytics', icon: 'bi bi-pie-chart' },
  { label: 'Settings', route: '/settings', icon: 'bi bi-gear' },
]

// Calendar
const initialDate = new Date()
initialDate.setHours(0, 0, 0, 0)
const currentDate = ref(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))
const selectedDate = ref(new Date(initialDate))
const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const currentMonthYear = computed(() =>
  currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
)

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
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: CalendarDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

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

const formattedSelectedDate = computed(() =>
  selectedDate.value.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
)

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

// Meal slots
const createEmptyMealSlots = (): MealSlot[] => [
  { type: 'breakfast', label: 'Breakfast', meal: '', ingredientIds: [] },
  { type: 'lunch', label: 'Lunch', meal: '', ingredientIds: [] },
  { type: 'dinner', label: 'Dinner', meal: '', ingredientIds: [] },
  { type: 'snack', label: 'Snacks', meal: '', ingredientIds: [] },
]

const mealSlots = ref<MealSlot[]>(createEmptyMealSlots())

const currentUser = ref<User | null>(null)
const isLoading = ref(false)
let unsubscribeAuth: (() => void) | null = null

// Inventory
const inventoryItems = ref<InventoryItem[]>([])

const getFoodRawField = (item: FoodItem, field: string) =>
  (item as unknown as Record<string, unknown>)[field]

const getInventoryIcon = (foodType: string, storageType: string) => {
  const type = foodType.toLowerCase()
  if (type.includes('vegetable') || type.includes('produce')) return '🥦'
  if (type.includes('dairy') || type.includes('milk')) return '🥛'
  if (type.includes('grain') || type.includes('rice')) return '🍚'
  if (type.includes('bread') || type.includes('bakery')) return '🍞'
  if (type.includes('egg')) return '🥚'
  if (storageType === 'fridge') return '🧊'
  if (storageType === 'freezer') return '❄️'
  if (storageType === 'pantry') return '📦'
  return '🍽️'
}

const formatStorageLocation = (value: unknown, fallbackType: string) => {
  if (typeof value === 'string' && value.trim()) return value
  const labels: Record<string, string> = {
    fridge: 'Fridge',
    pantry: 'Pantry',
    freezer: 'Freezer',
    countertop: 'Countertop',
  }
  return labels[fallbackType] ?? 'Storage'
}

const fetchInventory = async () => {
  if (!currentUser.value) return
  try {
    const items = await getUserFoodItems(currentUser.value.uid)
    inventoryItems.value = items
      .filter((item) => item.status === 'available' || item.status === 'planned')
      .map((item) => {
        const rawExpiryDate = getFoodRawField(item, 'expiry_date')
        const rawFoodType = getFoodRawField(item, 'food_type')
        const rawStorageLocation = getFoodRawField(item, 'storage_location')
        const expiryDateString =
          typeof rawExpiryDate === 'string' ? rawExpiryDate : new Date().toISOString().slice(0, 10)
        const storageType = item.type || 'fridge'
        const foodType = typeof rawFoodType === 'string' ? rawFoodType : item.foodType || 'Food'
        const expiry = new Date(`${expiryDateString}T00:00:00`)
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const diffTime = expiry.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return {
          id: item.id,
          icon: getInventoryIcon(foodType, storageType),
          name: item.name,
          location: formatStorageLocation(rawStorageLocation, storageType),
          expiry: expiry.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          expiryDate: expiry,
          warning: diffDays <= 3 && diffDays >= 0,
          tag: diffDays >= 0 ? `${diffDays}d` : 'Expired',
        }
      })
  } catch (error) {
    console.error('Error fetching inventory:', error)
  }
}

const getDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const loadMealsForDate = async () => {
  if (!currentUser.value) return

  const dateKey = getDateKey(selectedDate.value)
  isLoading.value = true

  try {
    const savedPlan = await getMealPlanByDate(currentUser.value.uid, dateKey)
    const nextSlots = createEmptyMealSlots()

    if (savedPlan) {
      const savedItems = await getMealPlanItems(savedPlan.id)
      savedItems.forEach((item) => {
        const slot = nextSlots.find((s) => s.type === item.meal_type)
        if (!slot) return
        if (!slot.meal && item.recipe_name) slot.meal = item.recipe_name
        if (!item.food_id.startsWith('manual-')) slot.ingredientIds.push(item.food_id)
      })
    }

    mealSlots.value = nextSlots
  } catch (error) {
    console.error('Error loading meal plan:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    if (user) {
      fetchInventory()
      loadMealsForDate()
    } else {
      inventoryItems.value = []
      mealSlots.value = createEmptyMealSlots()
    }
  })
})

onUnmounted(() => {
  unsubscribeAuth?.()
})

watch(selectedDate, loadMealsForDate)

// Inventory

// Removed mock inventory items

// Create meal form
const newMealName = ref('')
const selectedIngredients = ref<SelectedIngredient[]>([])
const selectedMealSlotForNewMeal = ref<MealTypeValue>('breakfast')
const showIngredientSelector = ref(false)
const ingredientSearch = ref('')
const tempSelectedIngredients = ref<Set<string>>(new Set())

const filteredInventoryForModal = computed(() => {
  if (!ingredientSearch.value) return inventoryItems.value
  const q = ingredientSearch.value.toLowerCase()
  return inventoryItems.value.filter(
    (item) =>
      item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q),
  )
})

const openIngredientSelector = () => {
  tempSelectedIngredients.value.clear()
  selectedIngredients.value.forEach((ing) => {
    const found = inventoryItems.value.find((item) => item.name === ing.name)
    if (found) tempSelectedIngredients.value.add(found.id)
  })
  showIngredientSelector.value = true
}

const closeIngredientSelector = () => {
  showIngredientSelector.value = false
  ingredientSearch.value = ''
}

const toggleIngredientSelection = (item: InventoryItem) => {
  if (tempSelectedIngredients.value.has(item.id)) {
    tempSelectedIngredients.value.delete(item.id)
  } else {
    tempSelectedIngredients.value.add(item.id)
  }
}

const isIngredientSelected = (item: InventoryItem) => tempSelectedIngredients.value.has(item.id)

const confirmIngredientSelection = () => {
  selectedIngredients.value = Array.from(tempSelectedIngredients.value)
    .map((id) => inventoryItems.value.find((i) => i.id === id))
    .filter((item): item is InventoryItem => Boolean(item))
    .map((item) => ({ id: item.id, icon: item.icon, name: item.name }))
  closeIngredientSelector()
}

const removeIngredient = (index: number) => {
  selectedIngredients.value.splice(index, 1)
}

const addMealToPlan = () => {
  if (!newMealName.value.trim()) {
    alert('Please enter a meal name')
    return
  }
  const slotType = selectedMealSlotForNewMeal.value
  const slot = mealSlots.value.find((s) => s.type === slotType)
  if (slot) {
    slot.meal = newMealName.value.trim()
    slot.ingredientIds = selectedIngredients.value.map((item) => item.id)
    newMealName.value = ''
    selectedIngredients.value = []
    closeCreateMealPanel()
  }
}

// Recommendations
const recommendations = ref<Recommendation[]>([
  { id: 1, icon: '🍛', name: 'Nasi Goreng', uses: 'Rice, Eggs, Chicken' },
  { id: 2, icon: '🍜', name: 'Mie Goreng', uses: 'Noodles, Eggs, Veggies' },
  { id: 3, icon: '🥞', name: 'Milk Pancakes', uses: 'UltraMilk, Eggs, Flour' },
])

const planRecommendation = (rec: Recommendation) => {
  // Find first empty slot
  const emptySlot = mealSlots.value.find((s) => !s.meal)
  if (emptySlot) {
    emptySlot.meal = rec.name
    emptySlot.ingredientIds = []
    alert(`"${rec.name}" added to ${emptySlot.label}`)
  } else {
    alert('All slots are filled. Edit one to replace it.')
  }
}

// Meal editing
const editingMealSlot = ref<string | null>(null)
const editingMealName = ref('')

const editingMealSlotLabel = computed(() => {
  const slot = mealSlots.value.find((s) => s.type === editingMealSlot.value)
  return slot?.label || ''
})

const openMealEdit = (slotType: string) => {
  const slot = mealSlots.value.find((s) => s.type === slotType)
  if (slot) {
    editingMealSlot.value = slotType
    editingMealName.value = slot.meal || ''
  }
}

const closeMealEdit = () => {
  editingMealSlot.value = null
  editingMealName.value = ''
}

const saveMealEdit = () => {
  if (!editingMealSlot.value) return
  const slot = mealSlots.value.find((s) => s.type === editingMealSlot.value)
  if (slot) {
    slot.meal = editingMealName.value.trim() || ''
    if (!slot.meal) slot.ingredientIds = []
  }
  closeMealEdit()
}

// Save plan
const saveMealPlan = async () => {
  if (!currentUser.value) {
    alert('Please log in to save your meal plan.')
    return
  }

  const dateKey = getDateKey(selectedDate.value)
  isLoading.value = true

  try {
    await saveDailyMealPlan(
      currentUser.value.uid,
      dateKey,
      mealSlots.value.map((slot) => ({
        mealType: slot.type,
        recipeName: slot.meal,
        foodIds: slot.ingredientIds,
        reservedQuantity: 1,
      })),
    )
    alert(`Meal plan for ${formattedSelectedDate.value} saved!`)
  } catch (error) {
    console.error('Error saving meal plan:', error)
    alert('Failed to save meal plan. Please try again.')
  } finally {
    isLoading.value = false
  }
}

// Right sidebar actions
const planWeekNavigate = () => alert('Week planning mode (prototype)')
const shoppingListNavigate = () => alert('Shopping list generated (prototype)')
const favoriteMealsNavigate = () => alert('Favorite meals view (prototype)')

const showCreateMealPanel = ref(false)

const openCreateMealPanel = () => {
  showCreateMealPanel.value = true
}

const closeCreateMealPanel = () => {
  showCreateMealPanel.value = false
}

// Misc
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
  grid-template-columns: 280px minmax(0, 1fr) clamp(232px, 18vw, 276px);
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

.inv-search-row .input-wrapper {
  flex: 1;
  width: 100%;
}

.inv-search-row .premium-input {
  min-height: 46px;
  padding: 12px 14px 12px 42px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content-container {
  width: 100%;
  max-width: 950px;
  perspective: 1000px;
}

.premium-glass {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.modal-box {
  background: white;
  border-radius: 32px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.modal-box.modal-create-meal {
  border-radius: 32px;
  padding: 0;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.create-meal-modal-header {
  padding: 24px 32px;
  background: linear-gradient(to right, #f8fafc, #ffffff);
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.create-meal-modal-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 48px;
  height: 48px;
  background: #ecfdf5;
  color: #059669;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.title-text h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.title-text span {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.modal-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: #fee2e2;
  color: #ef4444;
  transform: rotate(90deg);
}

.modal-body-grid {
  display: grid;
  grid-template-columns: 1fr auto 1.2fr;
  flex: 1;
  overflow: hidden;
}

.create-form-section {
  padding: 32px;
  overflow-y: auto;
}

.section-label {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #94a3b8;
  margin-bottom: 24px;
  text-transform: uppercase;
}

.form-field-group {
  margin-bottom: 24px;
}

.form-field-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
}

.input-wrapper,
.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper i,
.select-wrapper i {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  font-size: 1rem;
}

.premium-input,
.premium-select {
  width: 100%;
  padding: 12px 12px 12px 42px;
  background: #f8fafc;
  border: 2px solid #f1f5f9;
  border-radius: 16px;
  font-size: 0.95rem;
  color: #1e293b;
  transition: all 0.2s;
}

.premium-input:focus,
.premium-select:focus {
  outline: none;
  border-color: #10b981;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

.ingredients-list-container {
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  border-radius: 18px;
  padding: 16px;
}

.ingredients-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.ingredient-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  padding: 6px 10px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  font-size: 0.85rem;
}

.chip-icon {
  font-size: 1.1rem;
}

.chip-name {
  font-weight: 600;
  color: #334155;
}

.remove-chip {
  border: none;
  background: none;
  color: #94a3b8;
  padding: 2px;
  cursor: pointer;
  display: flex;
  transition: color 0.2s;
}

.remove-chip:hover {
  color: #ef4444;
}

.add-ingredient-trigger {
  width: 100%;
  padding: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #059669;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.add-ingredient-trigger:hover {
  background: #ecfdf5;
  border-color: #10b981;
  transform: translateY(-1px);
}

.btn-primary-glow {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 18px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 10px 20px -5px rgba(5, 150, 105, 0.4);
  transition: all 0.3s;
  margin-top: 8px;
}

.btn-primary-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 25px -5px rgba(5, 150, 105, 0.5);
  filter: brightness(1.1);
}

.btn-primary-glow:active {
  transform: translateY(0);
}

.modal-divider {
  width: 1px;
  background: #f1f5f9;
  margin: 32px 0;
}

.recommendations-section {
  background: #f8fafc;
  padding: 32px;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.reco-count {
  font-size: 0.75rem;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  padding: 4px 10px;
  border-radius: 20px;
}

.recommendations-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.premium-reco-card {
  display: flex;
  gap: 16px;
  background: white;
  padding: 16px;
  border-radius: 20px;
  margin-bottom: 12px;
  border: 1px solid #f1f5f9;
  transition: all 0.3s;
  cursor: default;
}

.premium-reco-card:hover {
  transform: translateX(5px);
  border-color: #10b981;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.reco-visual {
  width: 54px;
  height: 54px;
  background: #f8fafc;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.reco-details {
  flex: 1;
}

.reco-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.reco-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.reco-add-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.reco-add-btn:hover {
  background: #10b981;
  color: white;
  transform: scale(1.1);
}

.reco-ingredients {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.reco-ingredients i {
  color: #10b981;
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content-container {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from .modal-content-container {
  transform: scale(0.9) translateY(20px) rotateX(-10deg);
  opacity: 0;
}

/* List Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

@media (max-width: 850px) {
  .modal-body-grid {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  .modal-divider {
    height: 1px;
    width: 100%;
    margin: 0;
  }
  .modal-content-container {
    max-width: 500px;
  }
}

.modal-body-simple {
  padding: 24px 32px;
}

.inventory-list-scroll {
  max-height: 350px;
  overflow-y: auto;
  padding-right: 4px;
}

.premium-inventory-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 16px;
  margin-bottom: 8px;
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s;
}

.premium-inventory-item:hover {
  background: #f8fafc;
  transform: translateX(4px);
  border-color: #e2e8f0;
}

.premium-inventory-item.selected {
  background: #ecfdf5;
  border-color: #10b981;
}

.inv-icon-box {
  width: 44px;
  height: 44px;
  background: #f1f5f9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  transition: all 0.2s;
}

.premium-inventory-item.selected .inv-icon-box {
  background: white;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1);
}

.custom-checkbox {
  width: 22px;
  height: 22px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: white;
}

.custom-checkbox.checked {
  background: #10b981;
  border-color: #10b981;
}

.modal-footer {
  padding: 20px 32px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-btn-secondary {
  padding: 10px 20px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn-secondary:hover {
  background: #f1f5f9;
  color: #334155;
}

.modal-btn-primary {
  padding: 10px 24px;
  border-radius: 14px;
  border: none;
  background: #10b981;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
}

.modal-btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 6px 8px -1px rgba(16, 185, 129, 0.3);
}
</style>
