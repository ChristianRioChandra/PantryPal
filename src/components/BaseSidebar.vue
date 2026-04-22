<!-- src/components/BaseSidebar.vue -->
<template>
  <aside class="sidebar">
    <div
      class="logo-area"
      @click="navigateTo('/dashboard')"
      role="button"
      tabindex="0"
      @keydown.enter.space="navigateTo('/dashboard')"
    >
      <img class="logo-image" :src="logoFull" :alt="appName" />
    </div>
    <nav>
      <div
        v-for="item in navItems"
        :key="item.route"
        class="nav-item"
        :class="{ active: isActive(item.route) }"
        @click="navigateTo(item.route)"
      >
        <i v-if="item.icon" :class="item.icon"></i>
        <span v-else class="nav-dot"></span>
        <span>{{ item.label }}</span>
      </div>
    </nav>
    <hr />
  </aside>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import logoFull from '@/assets/logo/full.png'

export interface NavItem {
  label: string
  route: string
  icon?: string // optional; if missing, uses nav-dot
}

withDefaults(
  defineProps<{
    navItems: NavItem[]
    appName?: string
  }>(),
  {
    appName: 'PantryPal',
  },
)

const router = useRouter()
const route = useRoute()

const isActive = (itemRoute: string) => {
  if (itemRoute === '/') return route.path === '/'
  return route.path.startsWith(itemRoute)
}

const navigateTo = (routePath: string) => router.push(routePath)
</script>

<style scoped>
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
  margin-bottom: 44px;
  padding-left: 6px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;
}

.logo-area:hover {
  opacity: 0.8;
}

.logo-image {
  display: block;
  width: min(100%, 168px);
  height: auto;
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

.nav-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-border-secondary, #d1d5db);
  flex-shrink: 0;
  margin-right: 8px;
}
.nav-item.active .nav-dot {
  background: #1d9e75;
}
</style>
