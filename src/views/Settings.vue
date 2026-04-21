<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="settings-page">
    <div class="settings-shell">
      <BaseSidebar :nav-items="navItems" />

      <main class="main-content">
        <section class="hero-card">
          <div>
            <p class="hero-kicker">Preferences</p>
            <h1>Settings Page</h1>
            <p class="hero-copy">
              Manage security, listing visibility, and account details with the same PantryPal
              look and feel used across the rest of the app.
            </p>
          </div>

          <div class="hero-summary">
            <span class="summary-label">Security status</span>
            <strong>{{ securityStatus }}</strong>
            <span class="summary-caption">{{ visibilityLabel }} listings</span>
          </div>
        </section>

        <section class="settings-stack">
          <article class="setting-card">
            <div class="setting-copy">
              <div class="setting-icon">
                <i class="bi bi-shield-lock"></i>
              </div>
              <div>
                <h2>2 Factor Authentication</h2>
                <p>Add an extra verification step when signing in.</p>
              </div>
            </div>

            <button
              type="button"
              class="toggle-switch"
              :class="{ active: twoFactorEnabled }"
              :aria-pressed="twoFactorEnabled"
              @click="twoFactorEnabled = !twoFactorEnabled"
            >
              <span class="toggle-track">
                <span class="toggle-handle"></span>
              </span>
              <span class="toggle-text">{{ twoFactorEnabled ? 'On' : 'Off' }}</span>
            </button>
          </article>

          <article class="setting-card">
            <div class="setting-copy">
              <div class="setting-icon soft-blue">
                <i class="bi bi-eye"></i>
              </div>
              <div>
                <h2>Food Listing Visibility</h2>
                <p>Choose who can discover your shared food listings.</p>
              </div>
            </div>

            <div class="select-shell">
              <label class="sr-only" for="food-visibility">Food listing visibility</label>
              <select id="food-visibility" v-model="foodListingVisibility">
                <option
                  v-for="option in visibilityOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
          </article>

          <article class="setting-card">
            <div class="setting-copy">
              <div class="setting-icon soft-amber">
                <i class="bi bi-envelope-paper"></i>
              </div>
              <div>
                <h2>Mail Notification</h2>
                <p>Receive reminders about expiring food and donation activity.</p>
              </div>
            </div>

            <button
              type="button"
              class="toggle-switch"
              :class="{ active: mailNotificationsEnabled }"
              :aria-pressed="mailNotificationsEnabled"
              @click="mailNotificationsEnabled = !mailNotificationsEnabled"
            >
              <span class="toggle-track">
                <span class="toggle-handle"></span>
              </span>
              <span class="toggle-text">{{ mailNotificationsEnabled ? 'On' : 'Off' }}</span>
            </button>
          </article>

          <article class="account-card">
            <div class="account-header">
              <div>
                <p class="section-kicker">Profile</p>
                <h2>Account Detail</h2>
                <p class="account-subcopy">
                  Keep the essentials updated so meal planning and donation coordination stay
                  accurate.
                </p>
              </div>

              <div class="header-actions">
                <button
                  v-if="!isEditingProfile"
                  type="button"
                  class="ghost-btn"
                  @click="startEditing"
                >
                  Edit Profile
                </button>

                <template v-else>
                  <button type="button" class="ghost-btn muted" @click="cancelEditing">
                    Cancel
                  </button>
                  <button type="button" class="ghost-btn primary" @click="saveProfile">
                    Save
                  </button>
                </template>
              </div>
            </div>

            <div class="account-grid">
              <div class="details-panel">
                <div class="detail-row">
                  <span>Username</span>
                  <template v-if="isEditingProfile">
                    <input v-model.trim="draftAccount.username" type="text" />
                  </template>
                  <strong v-else>{{ account.username }}</strong>
                </div>

                <div class="detail-row">
                  <span>E-mail</span>
                  <template v-if="isEditingProfile">
                    <input v-model.trim="draftAccount.email" type="email" />
                  </template>
                  <strong v-else>{{ account.email }}</strong>
                </div>

                <div class="detail-row">
                  <span>Household Size</span>
                  <template v-if="isEditingProfile">
                    <input v-model.number="draftAccount.householdSize" type="number" min="1" />
                  </template>
                  <strong v-else>{{ account.householdSize }}</strong>
                </div>
              </div>

              <aside class="profile-highlight">
                <span class="highlight-label">Current setup</span>
                <strong>{{ visibilityLabel }} profile</strong>
                <p>{{ helperMessage }}</p>

                <div class="mini-stats">
                  <div>
                    <span>2FA</span>
                    <strong>{{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}</strong>
                  </div>
                  <div>
                    <span>Mail</span>
                    <strong>{{ mailNotificationsEnabled ? 'Enabled' : 'Disabled' }}</strong>
                  </div>
                </div>
              </aside>
            </div>

            <div class="account-footer">
              <button type="button" class="secondary-btn">Reset Password</button>
            </div>
          </article>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BaseSidebar from '@/components/BaseSidebar.vue'
import type { NavItem } from '@/components/BaseSidebar.vue'

type VisibilityOption = 'public' | 'community' | 'private'

interface AccountForm {
  username: string
  email: string
  householdSize: number
}

const navItems: NavItem[] = [
  { label: 'Dashboard', route: '/', icon: 'bi bi-graph-up' },
  { label: 'Inventory', route: '/inventory', icon: 'bi bi-box-seam' },
  { label: 'Meal Plan', route: '/meal-plan', icon: 'bi bi-calendar' },
  { label: 'Donation', route: '/donations', icon: 'bi bi-heart' },
  { label: 'Analytics', route: '/analytics', icon: 'bi bi-pie-chart' },
  { label: 'Settings', route: '/settings', icon: 'bi bi-gear' },
]

const visibilityOptions: Array<{ label: string; value: VisibilityOption }> = [
  { label: 'Public', value: 'public' },
  { label: 'Community Only', value: 'community' },
  { label: 'Private', value: 'private' },
]

const twoFactorEnabled = ref(true)
const mailNotificationsEnabled = ref(true)
const foodListingVisibility = ref<VisibilityOption>('public')
const isEditingProfile = ref(false)

const account = reactive<AccountForm>({
  username: 'Username Test',
  email: 'test@email.com',
  householdSize: 10,
})

const draftAccount = reactive<AccountForm>({
  username: account.username,
  email: account.email,
  householdSize: account.householdSize,
})

const visibilityLabel = computed(
  () =>
    visibilityOptions.find((option) => option.value === foodListingVisibility.value)?.label ??
    'Public',
)

const securityStatus = computed(() => {
  if (twoFactorEnabled.value && mailNotificationsEnabled.value) return 'Strong'
  if (twoFactorEnabled.value || mailNotificationsEnabled.value) return 'Balanced'
  return 'Basic'
})

const helperMessage = computed(() => {
  if (foodListingVisibility.value === 'public') {
    return 'Anyone browsing donations can discover your listings.'
  }

  if (foodListingVisibility.value === 'community') {
    return 'Listings are limited to your local PantryPal community.'
  }

  return 'Only you can view saved listings until you choose to share them.'
})

const startEditing = () => {
  draftAccount.username = account.username
  draftAccount.email = account.email
  draftAccount.householdSize = account.householdSize
  isEditingProfile.value = true
}

const cancelEditing = () => {
  draftAccount.username = account.username
  draftAccount.email = account.email
  draftAccount.householdSize = account.householdSize
  isEditingProfile.value = false
}

const saveProfile = () => {
  account.username = draftAccount.username || account.username
  account.email = draftAccount.email || account.email
  account.householdSize = Math.max(1, Number(draftAccount.householdSize) || account.householdSize)
  isEditingProfile.value = false
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

.settings-page {
  min-height: 100vh;
  padding: 24px 20px;
  background: #eef2f8;
  font-family: 'Inter', sans-serif;
  color: #0a1c2f;
}

.settings-shell {

  margin: 0 auto;
  display: grid;
  grid-template-columns: clamp(220px, 16vw, 256px) minmax(0, 1fr);
  gap: clamp(18px, 2vw, 28px);
  align-items: start;
}

.main-content {
  min-width: 0;
}

.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 30px 34px;
  border-radius: 36px;
  background: linear-gradient(135deg, #f7fbf8 0%, #ffffff 65%);
  border: 1px solid #e7edf6;
  box-shadow: 0 18px 40px rgba(31, 47, 62, 0.05);
  margin-bottom: 24px;
}

.hero-kicker,
.section-kicker,
.highlight-label,
.summary-label {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5e7b97;
}

.hero-card h1 {
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  margin-top: 6px;
}

.hero-copy {
  max-width: 700px;
  margin-top: 12px;
  font-size: 1rem;
  line-height: 1.6;
  color: #577190;
}

.hero-summary {
  min-width: 220px;
  padding: 22px 24px;
  border-radius: 28px;
  background: #1f5e3a;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 16px 32px rgba(44, 122, 77, 0.18);
}

.hero-summary strong {
  font-size: 1.5rem;
  font-weight: 800;
}

.summary-label,
.summary-caption {
  color: rgba(255, 255, 255, 0.76);
}

.summary-caption {
  font-size: 0.95rem;
}

.settings-stack {
  display: grid;
  gap: 18px;
}

.setting-card,
.account-card {
  background: white;
  border: 1px solid #e8eef7;
  border-radius: 32px;
  box-shadow: 0 16px 42px rgba(31, 47, 62, 0.04);
}

.setting-card {
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.setting-copy {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

.setting-icon {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  background: #e7f5ec;
  color: #2c7a4d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.setting-icon.soft-blue {
  background: #edf4ff;
  color: #285ea9;
}

.setting-icon.soft-amber {
  background: #fff3de;
  color: #c17c12;
}

.setting-copy h2,
.account-header h2 {
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.setting-copy p,
.account-subcopy,
.profile-highlight p {
  margin-top: 6px;
  font-size: 0.97rem;
  line-height: 1.6;
  color: #5d7692;
}

.toggle-switch {
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  color: #23415f;
  transition: background 0.2s ease;
}

.toggle-switch:hover {
  background: #f6f9fc;
}

.toggle-track {
  width: 70px;
  height: 38px;
  border-radius: 999px;
  background: #dce5f0;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: background 0.2s ease;
}

.toggle-handle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 6px 14px rgba(10, 28, 47, 0.14);
  transition: transform 0.2s ease;
}

.toggle-switch.active .toggle-track {
  background: #2c7a4d;
}

.toggle-switch.active .toggle-handle {
  transform: translateX(32px);
}

.toggle-text {
  font-size: 1.05rem;
  font-weight: 700;
  min-width: 34px;
  text-align: left;
}

.select-shell {
  min-width: 220px;
  position: relative;
}

.select-shell::after {
  content: '\F282';
  font-family: 'bootstrap-icons';
  position: absolute;
  top: 50%;
  right: 18px;
  transform: translateY(-50%);
  color: #6883a8;
  pointer-events: none;
}

.select-shell select,
.detail-row input {
  width: 100%;
  border: 1px solid #d9e3ef;
  border-radius: 18px;
  background: #f8fbff;
  color: #17304f;
  font: inherit;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.select-shell select {
  min-height: 56px;
  padding: 0 52px 0 18px;
  font-size: 1rem;
  font-weight: 600;
  appearance: none;
}

.select-shell select:focus,
.detail-row input:focus {
  border-color: #2c7a4d;
  background: white;
  box-shadow: 0 0 0 4px rgba(44, 122, 77, 0.12);
}

.account-card {
  padding: 28px 30px 30px;
}

.account-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ghost-btn,
.secondary-btn {
  border: none;
  border-radius: 999px;
  padding: 13px 22px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.ghost-btn {
  background: #eef3fb;
  color: #17304f;
}

.ghost-btn.primary,
.secondary-btn {
  background: #2c7a4d;
  color: white;
  box-shadow: 0 14px 28px rgba(44, 122, 77, 0.16);
}

.ghost-btn.muted {
  background: #f3f6fb;
  color: #5d7692;
}

.ghost-btn:hover,
.secondary-btn:hover {
  transform: translateY(-1px);
}

.account-grid {
  margin-top: 26px;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.95fr);
  gap: 22px;
}

.details-panel {
  display: grid;
  gap: 14px;
}

.detail-row {
  display: grid;
  grid-template-columns: minmax(150px, 220px) minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  min-height: 72px;
  padding: 18px 22px;
  border-radius: 24px;
  background: #f8fbff;
  border: 1px solid #edf2f7;
}

.detail-row span {
  font-size: 1.05rem;
  font-weight: 700;
  color: #17304f;
}

.detail-row strong {
  font-size: 1.05rem;
  font-weight: 600;
  color: #40607f;
}

.detail-row input {
  min-height: 48px;
  padding: 0 16px;
}

.profile-highlight {
  padding: 24px;
  border-radius: 28px;
  background: linear-gradient(180deg, #edf7ef 0%, #f9fcfa 100%);
  border: 1px solid #d8eadf;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-highlight strong {
  font-size: 1.45rem;
  font-weight: 800;
  color: #1f5e3a;
}

.mini-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 6px;
}

.mini-stats div {
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(44, 122, 77, 0.1);
}

.mini-stats span {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64866f;
}

.mini-stats strong {
  display: block;
  margin-top: 6px;
  font-size: 1rem;
  color: #17304f;
}

.account-footer {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 1040px) {
  .account-grid {
    grid-template-columns: 1fr;
  }

  .hero-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-summary {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 920px) {
  .settings-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 780px) {
  .settings-page {
    padding: 14px;
  }

  .hero-card,
  .account-card,
  .setting-card {
    border-radius: 26px;
  }

  .hero-card {
    padding: 24px 22px;
  }

  .setting-card {
    flex-direction: column;
    align-items: stretch;
    padding: 22px 20px;
  }

  .setting-copy h2,
  .account-header h2 {
    font-size: 1.55rem;
  }

  .toggle-switch,
  .select-shell {
    align-self: flex-start;
  }

  .account-card {
    padding: 24px 20px;
  }

  .account-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .detail-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

@media (max-width: 560px) {
  .hero-card h1 {
    font-size: 2rem;
  }

  .setting-copy {
    align-items: flex-start;
  }

  .setting-icon {
    width: 48px;
    height: 48px;
    border-radius: 18px;
  }

  .toggle-switch,
  .select-shell,
  .secondary-btn {
    width: 100%;
  }

  .toggle-switch {
    justify-content: space-between;
  }

  .mini-stats {
    grid-template-columns: 1fr;
  }

  .header-actions {
    display: grid;
    width: 100%;
  }

  .ghost-btn {
    width: 100%;
  }
}
</style>
