<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="analytics-page">
    <div class="dashboard">
      <BaseSidebar :nav-items="navItems" />

      <main class="main-content">
        <BaseTopbar
          title="Analytics"
          search-placeholder="Search saved food, donations, or categories..."
          v-model:search-value="searchQuery"
        >
          <template #actions>
            <i class="bi bi-sliders"></i>
          </template>
        </BaseTopbar>

        <div class="analytics-dashboard">
          <section class="filter-panel" aria-label="Analytics filters">
            <div class="range-selector" role="group" aria-label="Date range">
              <button
                v-for="option in dateRangeOptions"
                :key="option.value"
                type="button"
                class="range-btn"
                :class="{ active: dateRange === option.value }"
                :aria-pressed="dateRange === option.value"
                @click="setDateRange(option.value)"
              >
                <i :class="option.icon"></i>
                {{ option.label }}
              </button>
            </div>

            <div v-if="dateRange === 'custom'" class="custom-date-fields">
              <label class="date-field">
                <span>Start</span>
                <input v-model="customStartDate" type="date" />
              </label>
              <label class="date-field">
                <span>End</span>
                <input v-model="customEndDate" type="date" />
              </label>
            </div>

            <label class="category-field">
              <span>Category</span>
              <select v-model="selectedCategory">
                <option value="all">All categories</option>
                <option v-for="category in categoryOptions" :key="category" :value="category">
                  {{ formatCategory(category) }}
                </option>
              </select>
            </label>
          </section>

          <div v-if="statusMessage" class="status-message">
            <i class="bi bi-info-circle"></i>
            <span>{{ statusMessage }}</span>
          </div>

          <section class="stats-grid" aria-label="Analytics totals">
            <article
              v-for="card in metricCards"
              :key="card.label"
              class="stat-card"
              :class="card.tone"
            >
              <div class="stat-icon">
                <i :class="card.icon"></i>
              </div>
              <div class="stat-content">
                <span class="stat-label">{{ card.label }}</span>
                <strong class="stat-value">{{ card.value }}</strong>
                <span class="stat-detail">{{ card.detail }}</span>
              </div>
            </article>
          </section>

          <section class="charts-row" aria-label="Analytics charts">
            <article class="chart-card">
              <div class="card-header">
                <div>
                  <h3>Food Saved and Donations</h3>
                  <span class="subtitle">{{ activeRangeLabel }}</span>
                </div>
                <i class="bi bi-bar-chart"></i>
              </div>
              <div class="chart-container">
                <canvas ref="trendChart"></canvas>
              </div>
            </article>

            <article class="chart-card">
              <div class="card-header">
                <div>
                  <h3>By Category</h3>
                  <span class="subtitle">{{ filteredEvents.length }} tracked actions</span>
                </div>
                <i class="bi bi-pie-chart"></i>
              </div>
              <div class="chart-container">
                <canvas ref="categoryChart"></canvas>
              </div>
            </article>
          </section>

          <section class="progress-section" aria-label="Progress indicators">
            <article v-for="goal in progressRows" :key="goal.label" class="progress-card">
              <div class="progress-header">
                <div>
                  <h3>{{ goal.label }}</h3>
                  <span>{{ goal.detail }}</span>
                </div>
                <strong>{{ goal.percent }}%</strong>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :class="goal.tone"
                  :style="{ width: `${goal.percent}%` }"
                ></div>
              </div>
            </article>
          </section>

          <section class="activity-card" aria-label="Recent analytics activity">
            <div class="card-header">
              <div>
                <h3>Recent Activity</h3>
                <span class="subtitle">Filtered by {{ activeRangeLabel.toLowerCase() }}</span>
              </div>
              <i class="bi bi-clock-history"></i>
            </div>

            <div class="activity-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Action</th>
                    <th>Category</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="event in recentEvents" :key="event.id">
                    <td>{{ formatDate(event.date) }}</td>
                    <td>{{ event.name }}</td>
                    <td>
                      <span class="event-pill" :class="event.kind">
                        {{ formatEventKind(event.kind) }}
                      </span>
                    </td>
                    <td>{{ formatCategory(event.category) }}</td>
                    <td>{{ formatQuantity(event.quantity, event.unit) }}</td>
                  </tr>
                  <tr v-if="recentEvents.length === 0">
                    <td colspan="5" class="empty-state">No analytics activity in this filter.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { NavItem } from '@/components/BaseSidebar.vue'
import BaseSidebar from '@/components/BaseSidebar.vue'
import BaseTopbar from '@/components/BaseTopbar.vue'
import { auth } from '@/firebase'
import { FoodStatus, getUserFoodItems, type FoodItem } from '@/services/foodService'
import { getUserListings, type DonationListing } from '@/services/donationService'
import {
  getLocalAnalyticsEvents,
  type LocalAnalyticsEvent,
  type LocalAnalyticsKind,
} from '@/services/localAnalyticsStore'
import { onAuthStateChanged } from 'firebase/auth'

type DateRange = 'weekly' | 'monthly' | 'custom'
type AnalyticsSource = 'inventory' | 'firebase' | 'sample'

interface AnalyticsEvent {
  id: string
  kind: LocalAnalyticsKind
  name: string
  category: string
  foodType: string
  quantity: number
  unit: string
  date: Date
  source: AnalyticsSource
}

interface TrendBucket {
  label: string
  saved: number
  donated: number
}

interface CategorySlice {
  label: string
  value: number
}

const navItems: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'bi bi-graph-up' },
  { label: 'Inventory', route: '/inventory', icon: 'bi bi-box-seam' },
  { label: 'Meal Plan', route: '/meal-plan', icon: 'bi bi-calendar' },
  { label: 'Donation', route: '/donations', icon: 'bi bi-heart' },
  { label: 'Analytics', route: '/analytics', icon: 'bi bi-pie-chart' },
  { label: 'Settings', route: '/settings', icon: 'bi bi-gear' },
]

const dateRangeOptions: Array<{ value: DateRange; label: string; icon: string }> = [
  { value: 'weekly', label: 'Weekly', icon: 'bi bi-calendar-week' },
  { value: 'monthly', label: 'Monthly', icon: 'bi bi-calendar-month' },
  { value: 'custom', label: 'Custom', icon: 'bi bi-calendar-range' },
]

const today = new Date()
const sevenDaysAgo = new Date(today)
sevenDaysAgo.setDate(today.getDate() - 6)

const searchQuery = ref('')
const dateRange = ref<DateRange>('weekly')
const selectedCategory = ref('all')
const customStartDate = ref(toDateInputValue(sevenDaysAgo))
const customEndDate = ref(toDateInputValue(today))
const allEvents = ref<AnalyticsEvent[]>([])
const statusMessage = ref('')
const trendChart = ref<HTMLCanvasElement | null>(null)
const categoryChart = ref<HTMLCanvasElement | null>(null)
let unsubscribeAuth: (() => void) | null = null

const categoryOptions = computed(() => {
  const categories = new Set(
    allEvents.value.map((event) => event.category).filter((category) => category !== 'all'),
  )
  return Array.from(categories).sort((a, b) => formatCategory(a).localeCompare(formatCategory(b)))
})

const activeRange = computed(() => {
  const now = new Date()
  let start = new Date(now)
  let end = new Date(now)

  if (dateRange.value === 'weekly') {
    start.setDate(now.getDate() - 6)
  } else if (dateRange.value === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    start = customStartDate.value ? new Date(`${customStartDate.value}T00:00:00`) : new Date(now)
    end = customEndDate.value ? new Date(`${customEndDate.value}T23:59:59`) : new Date(now)
  }

  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  if (start > end) {
    return { start: end, end: start }
  }

  return { start, end }
})

const activeRangeLabel = computed(() => {
  if (dateRange.value === 'weekly') return 'This week'
  if (dateRange.value === 'monthly') return 'This month'
  return `${formatDate(activeRange.value.start)} to ${formatDate(activeRange.value.end)}`
})

const filteredEvents = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const { start, end } = activeRange.value

  return allEvents.value.filter((event) => {
    const matchesDate = event.date >= start && event.date <= end
    const matchesCategory =
      selectedCategory.value === 'all' || event.category === selectedCategory.value
    const searchableText =
      `${event.name} ${event.kind} ${event.category} ${event.foodType}`.toLowerCase()
    const matchesSearch = !query || searchableText.includes(query)

    return matchesDate && matchesCategory && matchesSearch
  })
})

const usedEvents = computed(() => filteredEvents.value.filter((event) => event.kind === 'used'))
const donatedEvents = computed(() =>
  filteredEvents.value.filter((event) => event.kind === 'donated'),
)

const totalSavedQuantity = computed(() =>
  usedEvents.value.reduce((total, event) => total + event.quantity, 0),
)

const totalDonatedQuantity = computed(() =>
  donatedEvents.value.reduce((total, event) => total + event.quantity, 0),
)

const metricCards = computed(() => [
  {
    label: 'Total Food Saved',
    value: `${usedEvents.value.length} items`,
    detail: `${formatNumber(totalSavedQuantity.value)} total quantity used`,
    icon: 'bi bi-leaf',
    tone: 'saved',
  },
  {
    label: 'Total Donations Made',
    value: `${donatedEvents.value.length} items`,
    detail: `${formatNumber(totalDonatedQuantity.value)} total quantity shared`,
    icon: 'bi bi-gift',
    tone: 'donated',
  },
  {
    label: 'Waste Avoided',
    value: `${filteredEvents.value.length} actions`,
    detail: 'Used or donated instead of wasted',
    icon: 'bi bi-recycle',
    tone: 'avoided',
  },
  {
    label: 'Category Filter',
    value: selectedCategory.value === 'all' ? 'All' : formatCategory(selectedCategory.value),
    detail: activeRangeLabel.value,
    icon: 'bi bi-funnel',
    tone: 'category',
  },
])

const trendBuckets = computed<TrendBucket[]>(() => {
  const { start, end } = activeRange.value
  const daysInRange = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1)
  const useMonthlyBuckets = daysInRange > 45
  const bucketMap = new Map<string, TrendBucket>()

  if (useMonthlyBuckets) {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    const last = new Date(end.getFullYear(), end.getMonth(), 1)

    while (cursor <= last) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
      bucketMap.set(key, {
        label: cursor.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
        saved: 0,
        donated: 0,
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }
  } else {
    const cursor = new Date(start)
    while (cursor <= end) {
      const key = toDateInputValue(cursor)
      bucketMap.set(key, {
        label: cursor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        saved: 0,
        donated: 0,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  filteredEvents.value.forEach((event) => {
    const key = useMonthlyBuckets
      ? `${event.date.getFullYear()}-${String(event.date.getMonth() + 1).padStart(2, '0')}`
      : toDateInputValue(event.date)
    const bucket = bucketMap.get(key)
    if (!bucket) return

    if (event.kind === 'used') bucket.saved += 1
    if (event.kind === 'donated') bucket.donated += 1
  })

  return Array.from(bucketMap.values())
})

const categoryBreakdown = computed<CategorySlice[]>(() => {
  const categoryMap = new Map<string, number>()

  filteredEvents.value.forEach((event) => {
    categoryMap.set(event.category, (categoryMap.get(event.category) ?? 0) + 1)
  })

  return Array.from(categoryMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
})

const progressRows = computed(() => {
  const savedTarget = Math.max(8, Math.ceil(Math.max(usedEvents.value.length, 1) / 8) * 8)
  const donationTarget = Math.max(5, Math.ceil(Math.max(donatedEvents.value.length, 1) / 5) * 5)
  const totalActionsTarget = Math.max(
    12,
    Math.ceil(Math.max(filteredEvents.value.length, 1) / 12) * 12,
  )

  return [
    {
      label: 'Food Saved Progress',
      detail: `${usedEvents.value.length} of ${savedTarget} saved items`,
      percent: getPercent(usedEvents.value.length, savedTarget),
      tone: 'saved',
    },
    {
      label: 'Donation Progress',
      detail: `${donatedEvents.value.length} of ${donationTarget} donated items`,
      percent: getPercent(donatedEvents.value.length, donationTarget),
      tone: 'donated',
    },
    {
      label: 'Waste Avoidance Progress',
      detail: `${filteredEvents.value.length} of ${totalActionsTarget} positive actions`,
      percent: getPercent(filteredEvents.value.length, totalActionsTarget),
      tone: 'avoided',
    },
  ]
})

const recentEvents = computed(() =>
  [...filteredEvents.value].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8),
)

watch(
  [trendBuckets, categoryBreakdown],
  () => {
    void nextTick(drawCharts)
  },
  { deep: true },
)

watch(categoryOptions, (categories) => {
  if (selectedCategory.value !== 'all' && !categories.includes(selectedCategory.value)) {
    selectedCategory.value = 'all'
  }
})

onMounted(() => {
  void loadAnalyticsData()
  unsubscribeAuth = onAuthStateChanged(auth, () => {
    void loadAnalyticsData()
  })
  window.addEventListener('storage', handleStorageUpdate)
  window.addEventListener('resize', drawCharts)
})

onUnmounted(() => {
  unsubscribeAuth?.()
  window.removeEventListener('storage', handleStorageUpdate)
  window.removeEventListener('resize', drawCharts)
})

function setDateRange(range: DateRange) {
  dateRange.value = range
}

async function loadAnalyticsData() {
  const localEvents = getLocalAnalyticsEvents().map(mapLocalEvent)
  let firebaseEvents: AnalyticsEvent[] = []
  let message = ''

  try {
    if (auth.currentUser) {
      firebaseEvents = await loadFirebaseEvents(auth.currentUser.uid)
    }
  } catch {
    message = 'Cloud analytics could not be loaded, so local inventory activity is shown.'
  }

  const combinedEvents = [...localEvents, ...firebaseEvents]

  if (combinedEvents.length > 0) {
    allEvents.value = combinedEvents
    statusMessage.value = message
    await nextTick()
    drawCharts()
    return
  }

  allEvents.value = createSampleEvents()
  statusMessage.value =
    'Showing sample analytics. Finish or donate inventory items to populate this report.'
  await nextTick()
  drawCharts()
}

async function loadFirebaseEvents(uid: string): Promise<AnalyticsEvent[]> {
  const [foodItems, donationListings] = await Promise.all([
    getUserFoodItems(uid),
    getUserListings(uid),
  ])
  const foodById = new Map(foodItems.map((food) => [food.id, food]))
  const foodEvents = foodItems
    .map(mapFoodItem)
    .filter((event): event is AnalyticsEvent => Boolean(event))
  const listingEvents = donationListings.map((listing) => mapDonationListing(listing, foodById))

  return [...foodEvents.filter((event) => event.kind === 'used'), ...listingEvents]
}

function mapLocalEvent(event: LocalAnalyticsEvent): AnalyticsEvent {
  return {
    ...event,
    category: normalizeCategory(event.category),
    date: parseDate(event.date) ?? new Date(),
    source: 'inventory',
  }
}

function mapFoodItem(item: FoodItem): AnalyticsEvent | null {
  if (item.status !== FoodStatus.USED && item.status !== FoodStatus.DONATED) return null

  const record = item as FoodItem & Record<string, unknown>

  return {
    id: `food_${item.id}`,
    kind: item.status === FoodStatus.USED ? 'used' : 'donated',
    name: item.name,
    category: getFoodCategory(record),
    foodType: String(record.type ?? record.foodType ?? 'Food'),
    quantity: getNumericValue(record.quantity, 1),
    unit: String(record.unit ?? 'item'),
    date: parseDate(record.created_at) ?? new Date(),
    source: 'firebase',
  }
}

function mapDonationListing(
  listing: DonationListing,
  foodById: Map<string, FoodItem>,
): AnalyticsEvent {
  const record = listing as DonationListing & Record<string, unknown>
  const linkedFood = foodById.get(listing.food_id)
  const linkedFoodRecord = linkedFood as (FoodItem & Record<string, unknown>) | undefined

  return {
    id: `listing_${listing.id}`,
    kind: 'donated',
    name: listing.title,
    category: linkedFoodRecord ? getFoodCategory(linkedFoodRecord) : 'donations',
    foodType: linkedFood ? String(linkedFoodRecord?.type ?? 'Food') : 'Donation',
    quantity: getNumericValue(record.quantity, 1),
    unit: 'item',
    date: parseDate(record.created_at) ?? new Date(),
    source: 'firebase',
  }
}

function getFoodCategory(record: Record<string, unknown>): string {
  return normalizeCategory(
    String(
      record.category_id ??
        record.categoryId ??
        record.type ??
        record.storage_location ??
        'uncategorized',
    ),
  )
}

function normalizeCategory(category: string): string {
  const normalized = category.trim().toLowerCase().replace(/\s+/g, '-')
  return normalized || 'uncategorized'
}

function getNumericValue(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function parseDate(value: unknown): Date | null {
  if (!value) return null

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate()
  }

  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function createSampleEvents(): AnalyticsEvent[] {
  const eventSeeds: Array<Omit<AnalyticsEvent, 'id' | 'date' | 'source'> & { daysAgo: number }> = [
    {
      kind: 'used',
      name: 'Fresh Spinach',
      category: 'fridge',
      foodType: 'Vegetables',
      quantity: 1,
      unit: 'item',
      daysAgo: 1,
    },
    {
      kind: 'donated',
      name: 'Canned Beans',
      category: 'pantry',
      foodType: 'Canned goods',
      quantity: 2,
      unit: 'items',
      daysAgo: 2,
    },
    {
      kind: 'used',
      name: 'Susu UltraMilk',
      category: 'fridge',
      foodType: 'Dairy & Eggs',
      quantity: 1,
      unit: 'item',
      daysAgo: 3,
    },
    {
      kind: 'donated',
      name: 'Frozen Corn',
      category: 'freezer',
      foodType: 'Frozen Foods',
      quantity: 1,
      unit: 'item',
      daysAgo: 4,
    },
    {
      kind: 'used',
      name: 'Bananas',
      category: 'counter',
      foodType: 'Fruits',
      quantity: 4,
      unit: 'items',
      daysAgo: 5,
    },
    {
      kind: 'used',
      name: 'Rice Bowl Leftovers',
      category: 'fridge',
      foodType: 'Meals',
      quantity: 1,
      unit: 'item',
      daysAgo: 8,
    },
    {
      kind: 'donated',
      name: 'Bread Loaf',
      category: 'pantry',
      foodType: 'Bakery & Grains',
      quantity: 1,
      unit: 'item',
      daysAgo: 12,
    },
  ]

  return eventSeeds.map((event, index) => {
    const date = new Date()
    date.setDate(date.getDate() - event.daysAgo)

    return {
      id: `sample_${index}`,
      kind: event.kind,
      name: event.name,
      category: event.category,
      foodType: event.foodType,
      quantity: event.quantity,
      unit: event.unit,
      date,
      source: 'sample',
    }
  })
}

function handleStorageUpdate() {
  void loadAnalyticsData()
}

function drawCharts() {
  drawTrendChart(trendChart.value, trendBuckets.value)
  drawCategoryChart(categoryChart.value, categoryBreakdown.value)
}

function prepareCanvas(canvas: HTMLCanvasElement) {
  const bounds = canvas.parentElement?.getBoundingClientRect()
  const width = Math.max(bounds?.width ?? 560, 280)
  const height = Math.max(bounds?.height ?? 300, 220)
  const pixelRatio = window.devicePixelRatio || 1
  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  canvas.width = Math.floor(width * pixelRatio)
  canvas.height = Math.floor(height * pixelRatio)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.clearRect(0, 0, width, height)

  return { ctx, width, height }
}

function drawTrendChart(canvas: HTMLCanvasElement | null, buckets: TrendBucket[]) {
  if (!canvas) return

  const prepared = prepareCanvas(canvas)
  if (!prepared) return

  const { ctx, width, height } = prepared
  const padding = { top: 34, right: 24, bottom: 46, left: 42 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(...buckets.flatMap((bucket) => [bucket.saved, bucket.donated]), 1)
  const scaleMax = Math.max(1, Math.ceil(maxValue * 1.25))

  ctx.save()
  ctx.font = '12px Inter, Arial, sans-serif'
  ctx.lineWidth = 1

  for (let step = 0; step <= 4; step += 1) {
    const ratio = step / 4
    const y = padding.top + chartHeight - chartHeight * ratio
    ctx.strokeStyle = '#e5ecf4'
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()

    ctx.fillStyle = '#6c7d92'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(Math.round(scaleMax * ratio)), padding.left - 10, y)
  }

  const bucketWidth = chartWidth / Math.max(buckets.length, 1)
  const barWidth = Math.min(22, Math.max(7, bucketWidth * 0.28))

  buckets.forEach((bucket, index) => {
    const groupX = padding.left + index * bucketWidth + bucketWidth / 2
    const savedHeight = (bucket.saved / scaleMax) * chartHeight
    const donatedHeight = (bucket.donated / scaleMax) * chartHeight
    const savedX = groupX - barWidth - 2
    const donatedX = groupX + 2
    const baseY = padding.top + chartHeight

    ctx.fillStyle = '#2c7a4d'
    drawRoundedBar(ctx, savedX, baseY - savedHeight, barWidth, savedHeight, 5)
    ctx.fillStyle = '#3772ff'
    drawRoundedBar(ctx, donatedX, baseY - donatedHeight, barWidth, donatedHeight, 5)

    if (index % Math.ceil(buckets.length / 8) === 0 || buckets.length <= 8) {
      ctx.fillStyle = '#6c7d92'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(bucket.label, groupX, baseY + 14)
    }
  })

  drawLegend(ctx, padding.left, 12, [
    { label: 'Saved', color: '#2c7a4d' },
    { label: 'Donated', color: '#3772ff' },
  ])

  ctx.restore()
}

function drawCategoryChart(canvas: HTMLCanvasElement | null, slices: CategorySlice[]) {
  if (!canvas) return

  const prepared = prepareCanvas(canvas)
  if (!prepared) return

  const { ctx, width, height } = prepared
  const colors = ['#2c7a4d', '#3772ff', '#d97706', '#9b5de5', '#ef4444', '#14b8a6']
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const centerX = width * 0.35
  const centerY = height * 0.5
  const radius = Math.min(width * 0.22, height * 0.32)
  const innerRadius = radius * 0.58

  ctx.save()

  if (total === 0) {
    ctx.strokeStyle = '#dfe7ef'
    ctx.lineWidth = Math.max(18, radius * 0.28)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.72, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#6c7d92'
    ctx.font = '600 14px Inter, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('No data', centerX, centerY)
    ctx.restore()
    return
  }

  let startAngle = -Math.PI / 2
  slices.forEach((slice, index) => {
    const angle = (slice.value / total) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle)
    ctx.closePath()
    ctx.fillStyle = colors[index % colors.length]!
    ctx.fill()
    startAngle += angle
  })

  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'

  ctx.fillStyle = '#17304f'
  ctx.font = '800 20px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(total), centerX, centerY - 8)
  ctx.font = '12px Inter, Arial, sans-serif'
  ctx.fillText('actions', centerX, centerY + 14)

  const legendX = Math.min(width * 0.66, width - 150)
  const legendY = Math.max(42, centerY - Math.min(slices.length, 6) * 16)

  slices.slice(0, 6).forEach((slice, index) => {
    const y = legendY + index * 30
    ctx.fillStyle = colors[index % colors.length]!
    ctx.beginPath()
    ctx.arc(legendX, y, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#344054'
    ctx.font = '12px Inter, Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${formatCategory(slice.label)}: ${slice.value}`, legendX + 16, y)
  })

  ctx.restore()
}

function drawRoundedBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if (height <= 0) return

  const safeRadius = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.lineTo(x + width - safeRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  ctx.lineTo(x + width, y + height)
  ctx.lineTo(x, y + height)
  ctx.lineTo(x, y + safeRadius)
  ctx.quadraticCurveTo(x, y, x + safeRadius, y)
  ctx.closePath()
  ctx.fill()
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  entries: Array<{ label: string; color: string }>,
) {
  entries.forEach((entry, index) => {
    const entryX = x + index * 96
    ctx.fillStyle = entry.color
    ctx.fillRect(entryX, y, 12, 12)
    ctx.fillStyle = '#344054'
    ctx.font = '12px Inter, Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(entry.label, entryX + 18, y + 6)
  })
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function getPercent(value: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((value / target) * 100))
}

function formatCategory(category: string): string {
  return category
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatEventKind(kind: LocalAnalyticsKind): string {
  return kind === 'used' ? 'Used' : 'Donated'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)
}

function formatQuantity(value: number, unit: string): string {
  return `${formatNumber(value)} ${unit}`
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.analytics-page {
  background: #eef2f8;
  color: #0a1c2f;
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
  overflow-x: clip;
  padding: 24px 20px;
}

.dashboard {
  align-items: start;
  display: grid;
  gap: clamp(18px, 2vw, 28px);
  grid-template-columns: clamp(220px, 16vw, 256px) minmax(0, 1fr);
  margin: 0 auto;
  max-width: 1760px;
}

.dashboard > * {
  min-width: 0;
}

.dashboard :deep(.sidebar) {
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.main-content {
  min-width: 0;
}

.main-content :deep(.top-bar) {
  width: 100%;
}

.main-content :deep(.top-bar-actions) {
  min-width: min(100%, 360px);
}

.main-content :deep(.search-wrapper) {
  flex: 1 1 280px;
  min-width: 0;
}

.analytics-dashboard {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.filter-panel {
  align-items: center;
  background: #ffffff;
  border-radius: 28px;
  box-shadow: 0 16px 42px rgba(31, 47, 62, 0.05);
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
  padding: 18px;
}

.range-selector {
  background: #f1f5f9;
  border-radius: 24px;
  display: flex;
  gap: 6px;
  padding: 6px;
}

.range-btn {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 18px;
  color: #48617c;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  gap: 8px;
  min-height: 42px;
  padding: 10px 14px;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.range-btn.active {
  background: #2c7a4d;
  color: #ffffff;
}

.custom-date-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.date-field,
.category-field {
  color: #48617c;
  display: flex;
  flex-direction: column;
  font-size: 0.78rem;
  font-weight: 800;
  gap: 6px;
  text-transform: uppercase;
}

.date-field input,
.category-field select {
  background: #f8fafc;
  border: 1px solid #dce5ef;
  border-radius: 16px;
  color: #17304f;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  min-height: 44px;
  min-width: 172px;
  outline: none;
  padding: 10px 14px;
  text-transform: none;
}

.category-field select {
  min-width: 210px;
}

.date-field input:focus,
.category-field select:focus {
  border-color: #2c7a4d;
  box-shadow: 0 0 0 3px rgba(44, 122, 77, 0.12);
}

.status-message {
  align-items: center;
  background: #fff9e8;
  border: 1px solid #f3dfaa;
  border-radius: 20px;
  color: #8a5a13;
  display: flex;
  gap: 10px;
  padding: 12px 16px;
}

.stats-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-card {
  align-items: center;
  background: #ffffff;
  border-radius: 28px;
  box-shadow: 0 16px 42px rgba(31, 47, 62, 0.05);
  display: flex;
  gap: 14px;
  min-height: 142px;
  overflow: hidden;
  padding: 20px;
  position: relative;
}

.stat-card::before {
  bottom: 0;
  content: '';
  left: 0;
  position: absolute;
  top: 0;
  width: 6px;
}

.stat-card.saved::before,
.progress-fill.saved {
  background: #2c7a4d;
}

.stat-card.donated::before,
.progress-fill.donated {
  background: #3772ff;
}

.stat-card.avoided::before,
.progress-fill.avoided {
  background: #d97706;
}

.stat-card.category::before {
  background: #9b5de5;
}

.stat-icon {
  align-items: center;
  background: #f1f5f9;
  border-radius: 18px;
  color: #2c7a4d;
  display: flex;
  flex: 0 0 54px;
  font-size: 1.6rem;
  height: 54px;
  justify-content: center;
  width: 54px;
}

.stat-card.donated .stat-icon {
  color: #3772ff;
}

.stat-card.avoided .stat-icon {
  color: #d97706;
}

.stat-card.category .stat-icon {
  color: #7c3aed;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stat-label {
  color: #60758f;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.stat-value {
  color: #12263f;
  font-size: clamp(1.35rem, 2vw, 1.85rem);
  font-weight: 800;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.stat-detail {
  color: #60758f;
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.35;
}

.charts-row {
  display: grid;
  gap: 22px;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
}

.chart-card,
.activity-card,
.progress-card {
  background: #ffffff;
  border-radius: 28px;
  box-shadow: 0 16px 42px rgba(31, 47, 62, 0.05);
}

.chart-card,
.activity-card {
  padding: 22px;
}

.card-header,
.progress-header {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-header h3,
.progress-header h3 {
  color: #12263f;
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
}

.card-header i,
.progress-header strong {
  color: #4c6682;
  font-size: 1.35rem;
}

.subtitle,
.progress-header span {
  color: #6c7d92;
  display: block;
  font-size: 0.84rem;
  font-weight: 600;
  margin-top: 2px;
}

.chart-container {
  height: 320px;
  position: relative;
  width: 100%;
}

.chart-container canvas {
  display: block;
  height: 100%;
  width: 100%;
}

.progress-section {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.progress-card {
  padding: 20px;
}

.progress-header {
  margin-bottom: 14px;
}

.progress-header strong {
  color: #12263f;
  font-size: 1.5rem;
  font-weight: 800;
}

.progress-bar {
  background: #e8eef5;
  border-radius: 999px;
  height: 12px;
  overflow: hidden;
}

.progress-fill {
  border-radius: inherit;
  height: 100%;
  min-width: 4px;
  transition: width 0.4s ease;
}

.activity-table-wrap {
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  min-width: 720px;
  width: 100%;
}

th,
td {
  border-bottom: 1px solid #edf2f7;
  color: #344054;
  font-size: 0.9rem;
  padding: 13px 12px;
  text-align: left;
  vertical-align: middle;
}

th {
  color: #60758f;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
}

td {
  font-weight: 600;
}

.event-pill {
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 6px 10px;
}

.event-pill.used {
  background: #e6f3eb;
  color: #1f5a38;
}

.event-pill.donated {
  background: #eaf1ff;
  color: #2457c5;
}

.empty-state {
  color: #71839a;
  font-weight: 700;
  text-align: center;
}

@media (max-width: 1320px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .charts-row,
  .progress-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1120px) {
  .dashboard {
    grid-template-columns: 1fr;
  }

  .main-content :deep(.top-bar) {
    padding: 18px 24px;
  }

  .main-content :deep(.top-bar-actions) {
    min-width: 100%;
    justify-content: stretch;
  }

  .main-content :deep(.search-wrapper) {
    width: 100%;
  }
}

@media (max-width: 780px) {
  .analytics-page {
    padding: 14px;
  }

  .filter-panel {
    align-items: stretch;
    border-radius: 24px;
    flex-direction: column;
  }

  .range-selector {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .range-btn {
    justify-content: center;
    padding: 10px;
  }

  .custom-date-fields {
    display: grid;
    grid-template-columns: 1fr;
  }

  .category-field select,
  .date-field input {
    min-width: 0;
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    min-height: 120px;
  }

  .chart-card,
  .activity-card,
  .progress-card {
    border-radius: 24px;
  }

  .chart-container {
    height: 280px;
  }
}

@media (max-width: 560px) {
  .analytics-page {
    padding: 12px;
  }

  .main-content :deep(.top-bar) {
    padding: 14px;
  }

  .range-selector {
    grid-template-columns: 1fr;
  }

  .range-btn {
    justify-content: flex-start;
  }

  .chart-card,
  .activity-card {
    padding: 16px;
  }

  .card-header,
  .progress-header {
    align-items: flex-start;
  }

  .chart-container {
    height: 250px;
  }
}
</style>
