<template>
  <div class="donation-page">
    <div class="dashboard">
      <BaseSidebar :nav-items="navItems" />

      <div class="main-content">
        <BaseTopbar
          title="Donations"
          search-placeholder="Search by item, category, location..."
          v-model:search-value="searchQuery"
        >
          <template #actions>
            <i class="bi bi-bell"></i>
            <i class="bi bi-gear"></i>
            <i class="bi bi-box-arrow-right"></i>
          </template>
        </BaseTopbar>

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

        <!-- Recent Listings Section -->
        <section class="section">
          <div class="section-header">
            <h3>Recent Listings</h3>
          </div>
          <div class="cards-grid">
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
                <button class="action-btn">Details</button>
                <button class="action-btn primary">Claim</button>
              </div>
            </div>
          </div>
          <button class="browse-all-btn">Browse All Donations →</button>
        </section>

        <!-- Browse All Section -->
        <section class="section">
          <div class="section-header">
            <h3>Browse Donations</h3>
            <div class="filter-sort">
              <button class="filter-btn" @click="cycleSort">
                <i class="bi bi-arrow-down-up"></i> Sort: {{ sortLabel }}
              </button>
              <button class="filter-btn" @click="cycleFilter">
                <i class="bi bi-funnel"></i> Filter: {{ filterLabel }}
              </button>
            </div>
          </div>
          <div class="cards-grid">
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
                <button class="action-btn">Details</button>
                <button class="action-btn primary">Claim</button>
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
          <button class="right-btn"><i class="bi bi-plus-circle"></i> Post Donation</button>
          <button class="right-btn"><i class="bi bi-geo-alt"></i> Set Pickup Location</button>
        </template>
        <template #stats>
          <div class="stat-item">
            <span>Active donations</span>
            <strong>{{ allListings.length }}</strong>
          </div>
          <div class="stat-item">
            <span>Nearby requests</span>
            <strong>12</strong>
          </div>
        </template>
      </BaseRightSidebar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseSidebar from '@/components/BaseSidebar.vue'
import BaseTopbar from '@/components/BaseTopbar.vue'
import BaseRightSidebar from '@/components/BaseRightSidebar.vue'
import type { NavItem } from '@/components/BaseSidebar.vue'

interface Tag {
  label: string
  variant?: 'green' | 'warn' | ''
}

interface DonationItem {
  id: number
  title: string
  tags: Tag[]
  description: string
  expiryDays?: number
}

const navItems: NavItem[] = [
  { label: 'Dashboard', route: '/', icon: 'bi bi-graph-up' },
  { label: 'Inventory', route: '/inventory', icon: 'bi bi-box-seam' },
  { label: 'Meal Plan', route: '/meal-plan', icon: 'bi bi-calendar' },
  { label: 'Donation', route: '/donations', icon: 'bi bi-heart' },
  { label: 'Analytics', route: '/analytics', icon: 'bi bi-pie-chart' },
  { label: 'Settings', route: '/settings', icon: 'bi bi-gear' },
]

const searchQuery = ref('')
const currentSort = ref<'name' | 'expiry'>('name')
const currentFilter = ref<'all' | 'near-expiry'>('all')

const recentListings = ref<DonationItem[]>([
  {
    id: 1,
    title: 'Susu UltraMilk · 500ml Original',
    tags: [{ label: 'Exp: 6 Apr', variant: 'warn' }, { label: 'Dairy' }, { label: '500ml' }],
    description: 'Full box, unopened. Pickup in Denpasar Selatan, available mornings.',
    expiryDays: 2,
  },
  {
    id: 2,
    title: 'Susu UltraMilk · 500ml Original',
    tags: [{ label: 'Fresh', variant: 'green' }, { label: 'Dairy' }, { label: '500ml' }],
    description: '2 boxes available. Can deliver nearby or pickup at gate.',
    expiryDays: 5,
  },
])

const allListings = ref<DonationItem[]>([
  {
    id: 3,
    title: 'Susu UltraMilk · 500ml Original',
    tags: [
      { label: 'Exp: 6 Apr', variant: 'warn' },
      { label: 'Dairy' },
      { label: 'Active', variant: 'green' },
    ],
    description: 'Unopened, pickup Kerobokan. Available 8am–12pm.',
    expiryDays: 2,
  },
  {
    id: 4,
    title: 'Susu UltraMilk · 500ml Original',
    tags: [
      { label: 'Dairy' },
      { label: '2d left', variant: 'warn' },
      { label: 'Active', variant: 'green' },
    ],
    description: '3 cartons. Contact via WhatsApp for pickup schedule.',
    expiryDays: 2,
  },
  {
    id: 5,
    title: 'Telur Kampung · 1 Dozen',
    tags: [
      { label: 'Fresh', variant: 'green' },
      { label: 'Protein' },
      { label: 'Active', variant: 'green' },
    ],
    description: 'Farm fresh eggs, pickup Ubud area only.',
    expiryDays: 7,
  },
  {
    id: 6,
    title: 'Roti Tawar · 1 Loaf',
    tags: [{ label: 'Exp: Today', variant: 'warn' }, { label: 'Bread' }],
    description: 'Half loaf remaining. Free, please take today.',
    expiryDays: 0,
  },
])

const filteredListings = computed(() => {
  let items = [...allListings.value]

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
  grid-template-columns: clamp(220px, 16vw, 256px) minmax(0, 1fr) clamp(232px, 18vw, 276px);
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
</style>
