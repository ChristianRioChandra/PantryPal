<template>
  <div class="donation-page">
    <div class="dashboard">
      <BaseSidebar :nav-items="navItems" />

      <div class="main-content">
        <!-- Hero Banner -->
        <div class="hero-banner">
          <div class="hero-icon">🤝</div>
          <div class="hero-text">
            <h2>Share Food, Reduce Waste</h2>
            <p>Post your surplus items or find available donations near you. Every share counts.</p>
          </div>
          <div class="hero-nav">
            <button class="hero-nav-btn"><i class="bi bi-chevron-left"></i></button>
            <button class="hero-nav-btn"><i class="bi bi-chevron-right"></i></button>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="tab-nav" style="display: flex; gap: 12px; margin-bottom: 24px">
          <button
            class="action-btn"
            :class="{ primary: currentTab === 'my-donations' }"
            @click="currentTab = 'my-donations'"
          >
            My Donations
          </button>
          <button
            class="action-btn"
            :class="{ primary: currentTab === 'browse' }"
            @click="currentTab = 'browse'"
          >
            Browse Donations
          </button>
          <button
            class="action-btn"
            :class="{ primary: currentTab === 'my-claims' }"
            @click="currentTab = 'my-claims'"
          >
            My Claims
          </button>
        </div>

        <!-- Your Donations Section -->
        <section v-if="currentTab === 'my-donations'" class="section">
          <div class="section-header">
            <h3>Your Donations</h3>
          </div>
          <div
            v-if="recentListings.length === 0"
            class="no-donations"
            style="
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 28px;
              border: 1px dashed #cbd5e1;
              color: #64748b;
            "
          >
            <i
              class="bi bi-heart"
              style="font-size: 2.5rem; color: #cbd5e1; display: block; margin-bottom: 12px"
            ></i>
            <p style="margin: 0; font-weight: 500">You haven't posted any donations yet.</p>
            <p style="margin: 4px 0 0; font-size: 0.88rem; color: #94a3b8">
              Use the sidebar to post surplus food items from your inventory!
            </p>
          </div>
          <div v-else class="cards-grid">
            <div v-for="item in recentListings" :key="item.id" class="donation-card">
              <div class="card-top">
                <span class="card-title">{{ item.title }}</span>
                <div class="card-check"></div>
              </div>
              <div class="card-tags">
                <span v-for="tag in item.tags" :key="tag.label" class="tag" :class="tag.variant">
                  {{ tag.label }}
                </span>
              </div>
              <div class="card-desc">{{ item.description }}</div>
              <div class="card-actions">
                <button class="action-btn" @click="showDetails(item)">Details</button>
                <button class="action-btn danger" @click="unpublishListing(item.id)">
                  Unpublish
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Browse All Section -->
        <section v-else-if="currentTab === 'browse'" class="section">
          <BaseTopbar
            title="Browse Donations"
            search-placeholder="Search by item, category, location..."
            v-model:search-value="searchQuery"
          >
          </BaseTopbar>
          <div class="section-header" style="margin-top: 24px">
            <h3>Browse Donations</h3>
            <div class="filter-bar">
              <div class="filter-sort">
                <!-- Location Dropdown -->
                <select v-model="filterPickupLocation" class="filter-btn">
                  <option value="">All Locations</option>
                  <option v-for="loc in availableLocations" :key="loc" :value="loc">
                    {{ loc }}
                  </option>
                </select>

                <!-- Category Dropdown -->
                <select v-model="filterCategory" class="filter-btn">
                  <option value="">All Categories</option>
                  <option v-for="cat in availableCategories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>

                <!-- Expiry Range Dropdown -->
                <select v-model="filterExpiryDays" class="filter-btn">
                  <option v-for="opt in expiryRangeOptions" :key="opt.label" :value="opt.value">
                    Expiry: {{ opt.label }}
                  </option>
                </select>

                <button class="filter-btn" @click="cycleSort">
                  <i class="bi bi-arrow-down-up"></i> Sort: {{ sortLabel }}
                </button>
                <button class="filter-btn" @click="cycleFilter">
                  <i class="bi bi-funnel"></i> {{ filterLabel }}
                </button>
              </div>
            </div>
          </div>
          <div
            v-if="filteredListings.length === 0"
            class="no-donations"
            style="
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 28px;
              border: 1px dashed #cbd5e1;
              color: #64748b;
            "
          >
            <i
              class="bi bi-search"
              style="font-size: 2.5rem; color: #cbd5e1; display: block; margin-bottom: 12px"
            ></i>
            <p style="margin: 0; font-weight: 500">No available donations found.</p>
            <p style="margin: 4px 0 0; font-size: 0.88rem; color: #94a3b8">
              Try adjusting your filters or search query.
            </p>
          </div>
          <div v-else class="cards-grid">
            <div v-for="item in filteredListings" :key="item.id" class="donation-card">
              <div class="card-top">
                <span class="card-title">{{ item.title }}</span>
                <div class="card-check"></div>
              </div>
              <div class="card-tags">
                <span v-for="tag in item.tags" :key="tag.label" class="tag" :class="tag.variant">
                  {{ tag.label }}
                </span>
              </div>
              <div class="card-desc">{{ item.description }}</div>
              <div class="card-actions">
                <button class="action-btn" @click="showDetails(item)">Details</button>
                <button
                  class="action-btn"
                  :class="claimedIds.has(item.id) ? 'claimed' : 'primary'"
                  :disabled="claimedIds.has(item.id)"
                  @click="claimListing(item.id)"
                >
                  {{ claimedIds.has(item.id) ? '✓ Claimed' : 'Claim' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- My Claims Section -->
        <section v-else-if="currentTab === 'my-claims'" class="section">
          <div class="section-header">
            <h3>My Claims</h3>
          </div>
          <div
            v-if="myClaims.length === 0"
            class="no-donations"
            style="
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 28px;
              border: 1px dashed #cbd5e1;
              color: #64748b;
            "
          >
            <i
              class="bi bi-check-circle"
              style="font-size: 2.5rem; color: #cbd5e1; display: block; margin-bottom: 12px"
            ></i>
            <p style="margin: 0; font-weight: 500">You haven't claimed any donations yet.</p>
          </div>
          <div v-else class="cards-grid">
            <div v-for="item in myClaims" :key="item.id" class="donation-card">
              <div class="card-top">
                <span class="card-title">{{ item.title }}</span>
                <div class="card-check"><i class="bi bi-check-lg"></i></div>
              </div>
              <div class="card-tags">
                <span v-for="tag in item.tags" :key="tag.label" class="tag" :class="tag.variant">
                  {{ tag.label }}
                </span>
              </div>
              <div class="card-desc">{{ item.description }}</div>
              <div class="card-actions">
                <button class="action-btn" @click="showDetails(item)">Details</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <BaseRightSidebar
        quick-actions-title="Donation Actions"
        :total-items="allListings.length"
        :expiring-soon="expiringSoonCount"
      >
        <template #quick-actions>
          <button class="right-btn" @click="postDonationNavigate">
            <i class="bi bi-plus-circle"></i> Post Donation
          </button>
          <button class="right-btn" @click="viewImpactAnalytics">
            <i class="bi bi-bar-chart-line-fill"></i> View Donation Impact
          </button>
        </template>
        <template #stats>
          <div class="stat-item">
            <div class="stat-label">
              <div class="stat-icon-wrapper total-bg"><i class="bi bi-globe"></i></div>
              <span>Active Donations</span>
            </div>
            <strong class="stat-value">{{ allListings.length }}</strong>
          </div>
          <div class="stat-item">
            <div class="stat-label">
              <div class="stat-icon-wrapper total-bg">
                <i class="bi bi-heart-fill" style="color: #e11d48"></i>
              </div>
              <span>Your Donations</span>
            </div>
            <strong class="stat-value">{{ recentListings.length }}</strong>
          </div>
          <div class="stat-item">
            <div class="stat-label">
              <div class="stat-icon-wrapper total-bg">
                <i class="bi bi-check-circle-fill" style="color: #2c7a4d"></i>
              </div>
              <span>Your Claims</span>
            </div>
            <strong class="stat-value">{{ claimedIds.size }}</strong>
          </div>
          <div class="stat-item">
            <div class="stat-label">
              <div class="stat-icon-wrapper warn-bg">
                <i class="bi bi-exclamation-circle-fill"></i>
              </div>
              <span>Expiring Soon</span>
            </div>
            <strong class="stat-value warning">{{ expiringSoonCount }}</strong>
          </div>
        </template>
      </BaseRightSidebar>
    </div>

    <!-- Read-Only Details Modal -->
    <Transition name="premium-modal">
      <div v-if="detailsModalOpen" class="modal-overlay" @click.self="closeDetailsModal">
        <div class="modal-box">
          <div class="modal-header">
            <h2>Donation Details</h2>
            <button class="close-icon-btn" @click="closeDetailsModal" aria-label="Close modal">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body">
            <h3 class="modal-item-title">{{ selectedDetailsItem?.title }}</h3>

            <div class="modal-tags">
              <span
                v-for="tag in selectedDetailsItem?.tags"
                :key="tag.label"
                class="tag"
                :class="tag.variant"
              >
                {{ tag.label }}
              </span>
            </div>

            <div class="detail-field">
              <span class="detail-label">Description</span>
              <div class="detail-value-box desc-box">
                {{ selectedDetailsItem?.description }}
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-field">
                <span class="detail-label">Pickup Location</span>
                <div class="detail-value-box icon-box">
                  <i class="bi bi-geo-alt-fill"></i>
                  <span>{{ selectedDetailsItem?.pickup_location || 'Not specified' }}</span>
                </div>
              </div>

              <div class="detail-field">
                <span class="detail-label">Availability Hours</span>
                <div class="detail-value-box icon-box">
                  <i class="bi bi-clock-fill"></i>
                  <span>
                    {{
                      selectedDetailsItem?.availability_start &&
                      selectedDetailsItem?.availability_end
                        ? `${selectedDetailsItem.availability_start} – ${selectedDetailsItem.availability_end}`
                        : 'Any time'
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="modal-close-btn" @click="closeDetailsModal">Close</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseSidebar from '@/components/BaseSidebar.vue'
import BaseTopbar from '@/components/BaseTopbar.vue'
import BaseRightSidebar from '@/components/BaseRightSidebar.vue'
import type { NavItem } from '@/components/BaseSidebar.vue'
import { auth, db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore'
import { claimDonation, cancelDonationListing } from '@/services/donationService'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

interface Tag {
  label: string
  variant?: 'green' | 'warn' | ''
}

interface DonationItem {
  id: string
  title: string
  tags: Tag[]
  description: string
  expiryDays?: number
  claimed?: boolean
  user_id: string
  food_id: string
  status: string
  pickup_location?: string
  availability_start?: string
  availability_end?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'bi bi-graph-up' },
  { label: 'Inventory', route: '/inventory', icon: 'bi bi-box-seam' },
  { label: 'Meal Plan', route: '/meal-plan', icon: 'bi bi-calendar' },
  { label: 'Donation', route: '/donations', icon: 'bi bi-heart' },
  { label: 'Analytics', route: '/analytics', icon: 'bi bi-pie-chart' },
  { label: 'Settings', route: '/settings', icon: 'bi bi-gear' },
]

const searchQuery = ref('')
const currentSort = ref<'name' | 'expiry'>('name')
const currentFilter = ref<'all' | 'near-expiry'>('all')
const currentTab = ref<'my-donations' | 'browse' | 'my-claims'>('my-donations')
const detailsModalOpen = ref(false)
const selectedDetailsItem = ref<DonationItem | null>(null)
const myClaims = ref<DonationItem[]>([])

const claimedIds = ref<Set<string>>(new Set())
watch(
  () => detailsModalOpen.value,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
)

const filterPickupLocation = ref('')
const filterCategory = ref('')
const filterExpiryDays = ref<number | null>(null)

const recentListings = ref<DonationItem[]>([])
const allListings = ref<DonationItem[]>([])

let unsubscribeAllListings: (() => void) | null = null
let unsubscribeUserListings: (() => void) | null = null
let unsubscribeClaims: (() => void) | null = null

function calculateDaysUntil(dateString: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateString}T00:00:00`)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function mapListingToDonationItem(listing: any): DonationItem {
  const expiryDate =
    listing.expiry_date || listing.expiryDate || new Date().toISOString().slice(0, 10)
  const pickupLocation = listing.pickup_location || listing.pickupLocation || ''
  const availabilityStart = listing.availability_start || listing.availabilityStart || ''
  const availabilityEnd = listing.availability_end || listing.availabilityEnd || ''

  const daysLeft = calculateDaysUntil(expiryDate)
  const tags: Tag[] = []

  if (daysLeft < 0) {
    tags.push({ label: 'Expired', variant: 'warn' })
  } else if (daysLeft === 0) {
    tags.push({ label: 'Exp: Today', variant: 'warn' })
  } else if (daysLeft <= 3) {
    tags.push({ label: `Exp: ${daysLeft}d left`, variant: 'warn' })
  } else {
    tags.push({ label: 'Fresh', variant: 'green' })
  }

  if (listing.status === 'active') {
    tags.push({ label: 'Active', variant: 'green' })
  } else if (listing.status === 'claimed') {
    tags.push({ label: 'Claimed', variant: 'warn' })
  } else {
    tags.push({ label: listing.status.charAt(0).toUpperCase() + listing.status.slice(1) })
  }

  tags.push({ label: `${listing.quantity} units` })

  return {
    id: listing.id,
    title: listing.title,
    tags,
    description:
      listing.description ||
      `Pickup at ${pickupLocation}. Available ${availabilityStart}–${availabilityEnd}.`,
    expiryDays: daysLeft,
    claimed: listing.status === 'claimed',
    user_id: listing.user_id,
    food_id: listing.food_id,
    status: listing.status,
    pickup_location: pickupLocation,
    availability_start: availabilityStart,
    availability_end: availabilityEnd,
  }
}

// Claims handling
// Function to load user's claimed donation items
const claimsLoading = ref(false)
const claimsErrorNotified = ref(false)

async function loadMyClaims(uid: string) {
  if (!uid) {
    console.warn('loadMyClaims called without uid')
    return
  }
  if (claimsLoading.value) {
    console.log('loadMyClaims already in progress')
    return
  }
  claimsLoading.value = true
  try {
    const claimsQuery = query(
      collection(db, 'donationRequests'),
      where('claimer_user_id', '==', uid),
    )
    const snap = await getDocs(claimsQuery)
    const claimIds = snap.docs.map((d) => d.data().listing_id)
    const claimItems: DonationItem[] = []
    for (const id of claimIds) {
      try {
        const docRef = doc(db, 'donationListings', id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          claimItems.push(mapListingToDonationItem({ id: docSnap.id, ...docSnap.data() }))
        }
      } catch (docErr) {
        // Individual listing may be inaccessible (e.g. cancelled/completed) — skip it
        console.warn(`Skipping inaccessible listing ${id}:`, docErr)
      }
    }
    myClaims.value = claimItems
  } catch (e) {
    console.error('Failed to load My Claims:', e)
  } finally {
    claimsLoading.value = false
  }
}

// Duplicate claimedIds removed – original declaration retained at line 320

function subscribeListings(uid: string) {
  const qAll = query(collection(db, 'donationListings'), where('status', '==', 'active'))
  unsubscribeAllListings = onSnapshot(
    qAll,
    (snap) => {
      allListings.value = snap.docs.map((d) => {
        return mapListingToDonationItem({ id: d.id, ...d.data() })
      })
    },
    (error) => {
      console.error('[DonationsPage] Error fetching active listings:', error)
    },
  )

  const qUser = query(collection(db, 'donationListings'), where('user_id', '==', uid))
  unsubscribeUserListings = onSnapshot(
    qUser,
    (snap) => {
      recentListings.value = snap.docs.map((d) => {
        return mapListingToDonationItem({ id: d.id, ...d.data() })
      })
    },
    (error) => {
      console.error('[DonationsPage] Error fetching user listings:', error)
    },
  )

  // Subscribe to listings and also load initial claims
  const qClaims = query(collection(db, 'donationRequests'), where('claimer_user_id', '==', uid))
  unsubscribeClaims = onSnapshot(
    qClaims,
    async (snap) => {
      const ids: string[] = []
      snap.docs.forEach((d) => {
        const req = d.data()
        if (req.status !== 'rejected') {
          ids.push(req.listing_id)
        }
      })
      // Update claimedIds set for UI
      claimedIds.value = new Set(ids)
      // Load detailed claim items only if not already loading
      if (!claimsLoading.value) {
        await loadMyClaims(uid)
      }
    },
    (error) => {
      console.error('[DonationsPage] Error fetching user claims:', error)
    },
  )
  // Initial load of claims when subscription starts
}

watch(
  () => authStore.user?.uid,
  (newUid) => {
    if (unsubscribeAllListings) {
      unsubscribeAllListings()
      unsubscribeAllListings = null
    }
    if (unsubscribeUserListings) {
      unsubscribeUserListings()
      unsubscribeUserListings = null
    }
    if (unsubscribeClaims) {
      unsubscribeClaims()
      unsubscribeClaims = null
    }
    myClaims.value = []
    // Reset error notification flag for new user session
    claimsErrorNotified.value = false
    if (newUid) {
      subscribeListings(newUid)
    } else {
      recentListings.value = []
      allListings.value = []
      claimedIds.value = new Set()
    }
  },
  { immediate: true },
)

// onMounted no longer needed for loading claims as subscribeListings handles it

onUnmounted(() => {
  if (unsubscribeAllListings) unsubscribeAllListings()
  if (unsubscribeUserListings) unsubscribeUserListings()
  if (unsubscribeClaims) unsubscribeClaims()
  document.body.style.overflow = ''
})

const availableLocations = computed(() => {
  const locations = new Set<string>()
  allListings.value.forEach((item) => {
    if (item.pickup_location) {
      locations.add(item.pickup_location)
    } else {
      const match = item.description.match(/pickup\s+([^.,]+)/i)
      if (match) locations.add(match[1]!.trim())
    }
  })
  return Array.from(locations).sort()
})

const availableCategories = computed(() => {
  const categories = new Set<string>()
  allListings.value.forEach((item) => {
    item.tags.forEach((tag) => {
      if (
        !['green', 'warn'].includes(tag.variant || '') &&
        !tag.label.match(/exp|active|left|units/i)
      ) {
        categories.add(tag.label)
      }
    })
  })
  return Array.from(categories).sort()
})

const expiryRangeOptions = [
  { label: 'All', value: null },
  { label: 'Today', value: 0 },
  { label: 'Within 2 days', value: 2 },
  { label: 'Within 3 days', value: 3 },
  { label: 'Within 7 days', value: 7 },
]

const filteredListings = computed(() => {
  let items = [...allListings.value]

  if (authStore.user?.uid) {
    items = items.filter((item) => item.user_id !== authStore.user?.uid)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.label.toLowerCase().includes(q)),
    )
  }

  if (currentFilter.value === 'near-expiry') {
    items = items.filter((item) => (item.expiryDays ?? 999) <= 3)
  }

  if (filterPickupLocation.value) {
    items = items.filter(
      (item) => item.pickup_location?.toLowerCase() === filterPickupLocation.value.toLowerCase(),
    )
  }

  if (filterCategory.value) {
    items = items.filter((item) => item.tags.some((tag) => tag.label === filterCategory.value))
  }

  if (filterExpiryDays.value !== null) {
    items = items.filter((item) => (item.expiryDays ?? 999) <= filterExpiryDays.value!)
  }

  items.sort((a, b) => {
    if (currentSort.value === 'expiry') {
      return (a.expiryDays ?? 999) - (b.expiryDays ?? 999)
    }
    return a.title.localeCompare(b.title)
  })

  return items
})

const expiringSoonCount = computed(() => {
  return allListings.value.filter((item) => item.expiryDays !== undefined && item.expiryDays <= 3)
    .length
})

const sortLabel = computed(() => (currentSort.value === 'name' ? 'Name' : 'Expiry'))
const filterLabel = computed(() => (currentFilter.value === 'all' ? 'All' : 'Near Expiry'))

const cycleSort = () => {
  currentSort.value = currentSort.value === 'name' ? 'expiry' : 'name'
}

const cycleFilter = () => {
  currentFilter.value = currentFilter.value === 'all' ? 'near-expiry' : 'all'
}

const toggleBrowseSection = () => {
  currentTab.value = currentTab.value === 'browse' ? 'my-donations' : 'browse'
}

const notifyMessage = (msg: string) => alert(msg)

async function claimListing(id: string) {
  const uid = authStore.user?.uid
  if (!uid) {
    notifyMessage('You must be logged in to claim items.')
    return
  }

  if (claimedIds.value.has(id)) {
    notifyMessage('You have already claimed this item.')
    return
  }

  try {
    await claimDonation(uid, id)
    claimedIds.value.add(id)
    // Reload claims and wait for completion before notifying
    await loadMyClaims(uid)
    // Switch to My Claims tab to show the newly claimed item
    currentTab.value = 'my-claims'
    notifyMessage('Item claimed! The donor will be notified. 🎉')
  } catch (error) {
    console.error('Failed to claim listing:', error)
    notifyMessage('Failed to claim item. Check your database rules.')
  }
}

async function unpublishListing(id: string) {
  try {
    await cancelDonationListing(id)
    notifyMessage('Donation listing unpublished successfully.')
  } catch (error) {
    console.error('Failed to unpublish listing:', error)
    notifyMessage('Failed to unpublish listing.')
  }
}

function showDetails(item: DonationItem) {
  selectedDetailsItem.value = item
  detailsModalOpen.value = true
}

function closeDetailsModal() {
  detailsModalOpen.value = false
  selectedDetailsItem.value = null
}

const postDonationNavigate = () => {
  router.push('/inventory')
}

const viewImpactAnalytics = () => {
  router.push('/analytics')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.donation-page {
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

/* Hero Banner */
.hero-banner {
  background: linear-gradient(135deg, #e0f2e9 0%, #ffffff 100%);
  border-radius: 34px;
  padding: 28px 32px;
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  box-shadow: 0 12px 30px rgba(31, 47, 62, 0.04);
}

.hero-icon {
  width: 72px;
  height: 72px;
  background: white;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.03);
}

.hero-text h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #0a1c2f;
}

.hero-text p {
  color: #577190;
  font-size: 1rem;
}

.hero-nav {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.hero-nav-btn {
  background: white;
  border: 1px solid #e2e8f0;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  cursor: pointer;
  color: #5f7f9e;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}

.hero-nav-btn:hover {
  background: #f3f6fb;
}

/* Sections */
.section {
  margin-bottom: 36px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0a1c2f;
}

.filter-sort {
  display: flex;
  gap: 10px;
}

.filter-btn {
  background: #f3f6fb;
  border: none;
  padding: 8px 16px;
  border-radius: 40px;
  font-weight: 500;
  font-size: 0.9rem;
  color: #2c3e4e;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: 0.2s;
}

.filter-btn:hover {
  background: #e2e8f0;
}

/* Cards Grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.donation-card {
  background: white;
  border-radius: 28px;
  padding: 22px;
  box-shadow: 0 10px 24px rgba(31, 47, 62, 0.04);
  border: 1px solid #e8eef7;
  transition: all 0.2s;
}

.donation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 28px rgba(31, 47, 62, 0.07);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: #0a1c2f;
}

.card-check {
  width: 22px;
  height: 22px;
  border: 2px solid #d1dbe8;
  border-radius: 6px;
  cursor: pointer;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.tag {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 20px;
  background: #f3f6fb;
  color: #486581;
  font-weight: 500;
}

.tag.green {
  background: #dcfce7;
  color: #166534;
}

.tag.warn {
  background: #fef3c7;
  color: #92400e;
}

.card-desc {
  color: #577190;
  font-size: 0.9rem;
  margin-bottom: 20px;
  line-height: 1.5;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  padding: 10px;
  border-radius: 40px;
  border: 1px solid #e2e8f0;
  background: white;
  font-weight: 600;
  font-size: 0.9rem;
  color: #2c3e4e;
  cursor: pointer;
  transition: 0.2s;
}

.action-btn.primary {
  background: #2c7a4d;
  color: white;
  border: none;
}

.action-btn.primary:hover {
  background: #1f5e3a;
}

.action-btn.danger {
  background: #fee2e2;
  color: #991b1b;
  border: none;
}

.action-btn.claimed {
  background: #e2e8f0;
  color: #64748b;
  border: none;
  cursor: not-allowed;
}

.action-btn.danger:hover {
  background: #fecaca;
}

.action-btn:hover {
  background: #f3f6fb;
}

.browse-all-btn {
  display: block;
  margin: 24px auto 0;
  background: none;
  border: 1px solid #2c7a4d;
  color: #2c7a4d;
  padding: 12px 30px;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.browse-all-btn:hover {
  background: #e0f2e9;
}

.browse-all-btn.secondary-btn {
  border-color: #577190;
  color: #577190;
}

.browse-all-btn.secondary-btn:hover {
  background: #f1f5f9;
}

/* Right Sidebar specific overrides */
.right-btn.primary {
  background: #2c7a4d;
  color: white;
}

.right-btn.primary:hover {
  background: #1f5e3a;
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

.stat-item strong {
  color: #0a1c2f;
}

/* Responsive */
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
  .sidebar,
  .right-sidebar {
    position: static;
  }
  .cards-grid {
    grid-template-columns: 1fr;
  }
  .hero-banner {
    flex-direction: column;
    text-align: center;
  }
  .hero-nav {
    margin-left: 0;
  }
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

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-select {
  padding: 8px 16px;
  border-radius: 40px;
  border: 1px solid #e2e8f0;
  background: white;
  font-size: 0.9rem;
  color: #2c3e4e;
  cursor: pointer;
  outline: none;
  min-width: 150px;
}

.filter-select:focus {
  border-color: #2c7a4d;
  box-shadow: 0 0 0 2px rgba(44, 122, 77, 0.1);
}

.filter-sort {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-select {
    width: 100%;
  }
  .filter-sort {
    margin-left: 0;
    justify-content: space-between;
  }
}

/* ==========================================================================
   Details Modal Styles
   ========================================================================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 28, 47, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  overflow-y: auto;
}

.modal-box {
  background: white;
  border-radius: 28px;
  padding: 30px 32px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: auto;
  position: relative;
  border: 1px solid rgba(233, 237, 242, 0.6);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #edf2f7;
  padding-bottom: 14px;
}

.modal-header h2 {
  font-weight: 800;
  font-size: 1.5rem;
  color: #0a1c2f;
  margin: 0;
}

.close-icon-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #a0aec0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-icon-btn:hover {
  background: #f3f6fb;
  color: #2c3e4e;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-item-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.modal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #5f7f9e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #2c3e4e;
  font-size: 0.95rem;
}

.detail-value-box.desc-box {
  padding: 12px 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 480px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.detail-value-box.icon-box {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-value-box.icon-box i {
  color: #2c7a4d;
  font-size: 1.1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.modal-close-btn {
  background: #2c7a4d;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 40px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: center;
}

.modal-close-btn:hover {
  background: #1f5e3a;
}

/* Modal Animations */
.premium-modal-enter-active,
.premium-modal-leave-active {
  transition: opacity 0.4s ease;
}

.premium-modal-enter-active .modal-box,
.premium-modal-leave-active .modal-box {
  transition: transform 0.5s cubic-bezier(0.2, 1, 0.3, 1);
}

.premium-modal-enter-from,
.premium-modal-leave-to {
  opacity: 0;
}

.premium-modal-enter-from .modal-box,
.premium-modal-leave-to .modal-box {
  transform: scale(0.9) translateY(30px);
}
</style>
