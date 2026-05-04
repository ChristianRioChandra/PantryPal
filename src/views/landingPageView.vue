<script lang="ts">
import logoFull from '@/assets/logo/full.png'
import logoFullWhite from '@/assets/logo/fullWhite.png'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'App',
  data() {
    return {
      appName: 'PantryPal',
      logoFull,
      logoFullWhite,
      stats: [
        { final: 33, suffix: '%', label: 'Food Wasted Globally' },
        { final: 40, suffix: '%', label: 'Household Food Waste' },
        { final: 1000, suffix: 'B+', label: 'Annual Economic Loss' },
        { final: 25, suffix: '%', label: 'Reduced by Smart Tools' },
      ],
      scrolled: false,
      menuOpen: false,
    }
  },
  setup() {
    const authStore = useAuthStore()
    return {
      authStore,
    }
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll)
    this.initIntersectionObserver()
    this.initStatsObserver()
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  },
  computed: {
    logoSrc() {
      return this.scrolled ? this.logoFull : this.logoFullWhite
    },
  },
  methods: {
    handleScroll() {
      this.scrolled = window.scrollY > 20
    },
    scrollToSection(sectionId: string) {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        this.menuOpen = false
      }
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      this.menuOpen = false
    },
    goToLogin() {
      this.$router.push('/login')
    },
    goToRegister() {
      this.$router.push('/register')
    },
    goToDashboard() {
      this.$router.push('/dashboard')
    },
    async handleLogout() {
      await this.authStore.logout()
      this.$router.push('/')
    },
    initIntersectionObserver() {
      const elements = document.querySelectorAll('.fade-up, .fade-left, .fade-right')
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('show')
            }
          })
        },
        {
          threshold: 0.2,
        },
      )
      elements.forEach((el) => observer.observe(el))
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen
    },
    animateCount(el: HTMLElement) {
      const target = parseInt(el.dataset.target as string)
      const suffix = el.dataset.suffix || ''
      let current = 0
      const increment = target / 100
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          el.textContent = `${target.toLocaleString()}${suffix}`
          clearInterval(timer)
          return
        }
        el.textContent = `${Math.floor(current).toLocaleString()}${suffix}`
      }, 20)
    },
    initStatsObserver() {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.animateCount(entry.target as HTMLElement)
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.5 },
      )
      document.querySelectorAll('.stat-num').forEach((el) => observer.observe(el))
    },
  },
}
</script>

<template>
  <div class="landing-page">
    <!-- NAV -->
    <nav id="navbar" :class="{ scrolled: scrolled, open: menuOpen }">
      <img class="logo-image" :src="logoSrc" :alt="appName" />

      <ul class="nav-links" :class="{ active: menuOpen }">
        <li><a href="#about" @click.prevent="scrollToSection('about')">About</a></li>
        <li><a href="#how" @click.prevent="scrollToSection('how')">How It Works</a></li>
        <li><a href="#features" @click.prevent="scrollToSection('features')">Features</a></li>
        <li><a href="#mission" @click.prevent="scrollToSection('mission')">Mission</a></li>
      </ul>

      <div class="nav-cta">
        <!-- When NOT logged in -->
        <template v-if="!authStore.isLoggedIn">
          <a href="#" class="btn-outline" @click.prevent="goToLogin">Log In</a>
          <a href="#" class="btn-primary" @click.prevent="goToRegister">Get Started</a>
        </template>
        <!-- When logged in -->
        <template v-else>
          <span class="user-greeting">Welcome, {{ authStore.userName }}!</span>
          <a href="#" class="btn-primary" @click.prevent="goToDashboard">Dashboard</a>
          <button class="btn-outline logout-btn" @click="handleLogout">Logout</button>
        </template>
      </div>

      <div
        class="hamburger"
        id="hamburger"
        :class="{ active: menuOpen }"
        role="button"
        aria-label="Toggle navigation"
        tabindex="0"
        @click="toggleMenu"
        @keydown.enter.prevent="toggleMenu"
      >
        <span></span><span></span><span></span>
      </div>
    </nav>

    <!-- HERO -->
    <section class="hero">
      <div class="hero-texture"></div>

      <div class="hero-left">
        <p class="tagline">— Smart Food Management</p>
        <h1>
          PantryPal <br />
          where <span>Food</span> Meets <br />
          Smart Planning
        </h1>
        <p class="desc">
          Track your food inventory, reduce waste, plan meals, and donate surplus items — all in one
          place.
        </p>
        <button class="btn-primary hero-button" @click="goToRegister">Get Started →</button>
      </div>

      <div class="hero-right" aria-hidden="true">
        <div class="hero-orbit">
          <div class="pantry-preview">
            <div class="preview-header">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="preview-row fresh">
              <strong>Fresh Produce</strong>
              <span>Today</span>
            </div>
            <div class="preview-row warning">
              <strong>Use Soon</strong>
              <span>3 items</span>
            </div>
            <div class="preview-row donate">
              <strong>Ready to Donate</strong>
              <span>2 items</span>
            </div>
          </div>
        </div>

        <div class="badge users">
          <h1><i class="bi bi-bell"></i></h1>
        </div>
        <div class="badge review">Reduce Waste</div>
      </div>
    </section>

    <!-- ABOUT SECTION-->
    <section id="about" class="about-section fade-up" ref="about">
      <div class="about-left">
        <p class="tagline">— About PantryPal</p>
        <h2>What is PantryPal?</h2>
        <p>
          PantryPal is a smart food management platform designed to help users track their food
          inventory, monitor expiry dates, and plan meals efficiently. It simplifies kitchen
          management while helping reduce unnecessary food waste.
        </p>
      </div>

      <div class="about-right">
        <img src="../assets/logo/PP_icon.png" alt="pantry" />
      </div>
    </section>

    <!-- WHY SECTION -->
    <section id="how" class="why-section fade-left" ref="how">
      <div class="why-left">
        <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836" alt="food" />
      </div>
      <div class="why-right">
        <p class="tagline">— Why PantryPal</p>
        <h2>Why This Website Was Built</h2>
        <p>
          Many households struggle with managing food efficiently. Items are often forgotten, expire
          without notice, and contribute to unnecessary waste.
        </p>
        <p>
          PantryPal was created to solve these everyday problems by providing a simple, intuitive
          platform that helps users organize their food, reduce waste, and even share surplus food
          with others through donation.
        </p>
        <ul>
          <li>✔ Reduce food waste</li>
          <li>✔ Save money</li>
          <li>✔ Improve meal planning</li>
          <li>✔ Support food sharing</li>
        </ul>
      </div>
    </section>

    <!-- FEATURES SECTION -->
    <section id="features" class="features-section fade-up" ref="features">
      <div class="section-heading">
        <p class="tagline">— Features</p>
        <h2>Everything your kitchen needs to stay organized</h2>
      </div>

      <div class="feature-grid">
        <article class="feature-card">
          <h3> <i class="bi-box"></i>  Food inventory</h3>
          <p>Keep everyday pantry items, fridge staples, and freezer stock easy to find.</p>
        </article>
        <article class="feature-card">
          <h3> <i class="bi-bell"></i>  Expiry reminders</h3>
          <p>Spot food that needs attention before it becomes waste.</p>
        </article>
        <article class="feature-card">
          <h3> <i class="bi-calendar"></i>  Weekly meal planning</h3>
          <p>Build simple plans around the ingredients you already have.</p>
        </article>
        <article class="feature-card">
          <h3> <i class="bi-heart"></i>  Donation support</h3>
          <p>Share surplus items with others when your pantry has more than you need.</p>
        </article>
      </div>
    </section>

    <!-- MISSION SECTION -->
    <section id="mission" class="mission-section fade-right" ref="mission">
      <div class="mission-copy">
        <p class="tagline">— Vision</p>
        <h2>Make food management EASY</h2>
        <p>
          PantryPal brings planning, tracking, and sharing together so households can make better
          decisions with the food they already own.
        </p>
      </div>

      <div class="mission-copy">
        <p class="tagline">— Mission</p>
        <div class="mission-panel">
          <div>
            <strong>Less waste</strong>
            <span>Use more before it expires.</span>
          </div>
          <div>
            <strong>Better planning</strong>
            <span>Turn ingredients into meals.</span>
          </div>
          <div>
            <strong>More sharing</strong>
            <span>Help surplus food reach people.</span>
          </div>
        </div>
      </div>
    </section>

    <!-- STATISTICS SECTION -->
    <section id="stats" class="stats-section fade-up">
      <div class="stats-container">
        <p class="tagline">— By the Numbers</p>
        <h2>Real Impact</h2>
        <div class="stats-grid">
          <div v-for="(stat, index) in stats" :key="'stat-' + index" class="stat-item">
            <div class="stat-num" :data-target="stat.final" :data-suffix="stat.suffix">0</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
        <p class="stats-source">Sources: FAO, USDA, WRAP | Public data for awareness</p>
      </div>
    </section>

    <!-- HOW TO USE SECTION -->
    <section id="howto" class="howto-section">
      <div class="section-heading">
        <p class="tagline">— Get Started in Seconds</p>
        <h2>How It Works</h2>
      </div>
      <div class="steps-grid">
        <div class="step-card fade-up">
          <span class="step-number">1</span>
          <h3>Add Your Items</h3>
          <p>Scan or manually add groceries with expiry dates.</p>
        </div>
        <div class="step-card fade-left">
          <span class="step-number">2</span>
          <h3>Get Smart Alerts</h3>
          <p>Receive notifications for items nearing expiry.</p>
        </div>
        <div class="step-card fade-right">
          <span class="step-number">3</span>
          <h3>Plan Meals</h3>
          <p>Generate weekly plans from your inventory.</p>
        </div>
        <div class="step-card fade-up">
          <span class="step-number">4</span>
          <h3>Share Surplus</h3>
          <p>Donate items before they go to waste.</p>
        </div>
      </div>
    </section>

    <!-- CTA SECTION -->
    <section class="cta-section fade-up">
      <div class="cta-content">
        <h2>Ready to Transform Your Food Storage?</h2>
        <p>Join Now to Reduce Food Waste and Save Money.</p>
        <div class="cta-buttons">
          <button class="btn-primary cta-btn-large" @click="goToRegister">Get Started Free</button>
          <a href="#" class="btn-outline" @click.prevent="scrollToTop">Learn More →</a>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-brand">
          <a href="#" class="nav-logo" @click.prevent="scrollToTop">
            <img class="logo-image small" :src="logoSrc" :alt="appName" />
          </a>
        </div>
        <div class="footer-links">
          <div class="link-group">
            <h4>Product</h4>
            <a href="#features" @click.prevent="scrollToSection('features')">Features</a>
            <a href="#howto" @click.prevent="scrollToSection('howto')">How It Works</a>
            <a href="#about" @click.prevent="scrollToSection('about')">About</a>
          </div>
          <div class="link-group">
            <h4>Company</h4>
            <a href="#mission" @click.prevent="scrollToSection('mission')">Mission</a>
            <a href="#">Careers</a>
            <a href="#">Press</a>
          </div>
          <div class="link-group">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Contact</a>
            <a href="#">Privacy</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 PantryPal. All rights reserved. Strive to reduce food waste.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  --surface: #fffdf8;
  --surface-soft: #f7f2e8;
  --sage: #7a9e7e;
  --deep-sage: #4a7050;
  --forest: #243f2d;
  --clay: #c4724a;
  --amber: #d4a847;
  --ink: #16221a;
  --slate: #425e6f;
  --muted: #65756a;
  --sky: #dceaf0;
  --border: rgba(36, 63, 45, 0.14);

  background: var(--surface);
  color: var(--ink);
  font-family:
    'DM Sans',
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
}

.landing-page *,
.landing-page *::before,
.landing-page *::after {
  box-sizing: border-box;
}

:global(html) {
  scroll-behavior: smooth;
}

/* NAV */
nav {
  align-items: center;
  display: flex;
  justify-content: space-between;
  left: 0;
  padding: 18px clamp(20px, 5vw, 72px);
  position: fixed;
  right: 0;
  top: 0;
  transition:
    background 0.4s ease,
    box-shadow 0.4s ease,
    padding 0.4s ease;
  z-index: 100;
}

nav.scrolled,
nav.open {
  background: rgba(255, 253, 248, 0.9);
  backdrop-filter: blur(18px);
  box-shadow:
    0 1px 0 var(--border),
    0 18px 45px rgba(36, 63, 45, 0.08);
  padding-bottom: 14px;
  padding-top: 14px;
  -webkit-text-fill-color: #16221a;
}

nav.scrolled .btn-outline:hover,
nav.open .btn-outline:hover {
  -webkit-text-fill-color: #fff;
}

.nav-logo {
  align-items: center;
  display: flex;
  gap: 10px;
  text-decoration: none;
}

.nav-logo-mark {
  align-items: center;
  background: var(--forest);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 50% 50% 50% 10px;
  box-shadow: 0 12px 28px rgba(36, 63, 45, 0.2);
  color: #fff;
  display: flex;
  font-size: 18px;
  height: 40px;
  justify-content: center;
  width: 40px;
}

.nav-logo-text {
  color: var(--forest);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.32rem;
  font-weight: 700;
}

.nav-links {
  align-items: center;
  display: flex;
  gap: clamp(18px, 3vw, 38px);
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  color: rgba(255, 255, 255, 1);
  font-size: 0.92rem;
  font-weight: 600;
  position: relative;
  text-decoration: none;
  transition: color 0.2s ease;
}

.nav-links a::after {
  background: var(--clay);
  border-radius: 999px;
  bottom: -8px;
  content: '';
  height: 2px;
  left: 0;
  position: absolute;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.2s ease;
  width: 100%;
}

.nav-links a:hover {
  color: var(--sage);
}

.nav-links a:hover::after {
  transform: scaleX(1);
}

.nav-cta {
  align-items: center;
  display: flex;
  gap: 12px;
}

.user-greeting {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  font-size: 0.85rem;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  color: #fff;
}

.btn-outline,
.btn-primary {
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  justify-content: center;
  min-height: 42px;
  padding: 11px 22px;
  padding-top: 15px;
  text-decoration: none;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn-outline {
  background: rgba(255, 255, 255, 0.6);
  border: 1.5px solid rgba(36, 63, 45, 0.38);
  color: var(--forest);
}

.btn-outline:hover {
  background: var(--forest);
  border-color: var(--forest);
  color: #fff;
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--clay);
  border: 1.5px solid var(--clay);
  box-shadow: 0 12px 24px rgba(196, 114, 74, 0.28);
  color: #fff;
}

.btn-primary:hover {
  background: #ac5f3e;
  border-color: #ac5f3e;
  transform: translateY(-2px);
}

/* HERO */
.hero {
  align-items: center;
  background:
    linear-gradient(
      90deg,
      rgba(11, 21, 14, 0.76),
      rgba(11, 21, 14, 0.48) 48%,
      rgba(11, 21, 14, 0.14)
    ),
    url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=80');
  background-position: center;
  background-size: cover;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.95fr);
  isolation: isolate;
  min-height: 92vh;
  overflow: hidden;
  padding: clamp(112px, 13vw, 154px) clamp(24px, 7vw, 108px) clamp(70px, 10vw, 112px);
  position: relative;
}

.hero::after {
  background: linear-gradient(180deg, transparent 0%, rgba(255, 253, 248, 0.9) 100%);
  bottom: 0;
  content: '';
  height: 18%;
  left: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  z-index: -1;
}

.hero-texture {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 74px 74px;
  inset: 0;
  mask-image: linear-gradient(90deg, black 0%, transparent 72%);
  opacity: 0.24;
  pointer-events: none;
  position: absolute;
  z-index: -1;
}

.hero-left {
  animation: fadeUp 0.9s ease both;
  max-width: 690px;
  position: relative;
  z-index: 1;
}

.tagline {
  color: var(--amber);
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
  text-transform: uppercase;
}

.hero-left h1 {
  color: #fffdf8;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.2rem, 5vw, 6.9rem);
  letter-spacing: 0;
  line-height: 0.98;
  margin: 0 0 24px;
  max-width: 900px;
  text-wrap: balance;
  text-shadow:
    #000000 1px 1px 2px,
    #000000 2px 2px 4px,
    #000000 3px 3px 6px;
}

.hero-left span {
  color: #f7c264;
}

.desc {
  color: rgba(255, 253, 248, 0.86);
  font-size: clamp(1rem, 1.4vw, 1.16rem);
  line-height: 1.75;
  margin: 0 0 34px;
  max-width: 580px;
}

.hero-button {
  font-size: 0.98rem;
  min-height: 48px;
  padding-inline: 26px;
}

.hero-right {
  align-items: center;
  animation: fadeIn 1s ease 0.2s both;
  display: flex;
  justify-content: center;
  min-height: 430px;
  position: relative;
  z-index: 1;
}

.hero-orbit {
  align-items: center;
  background: rgba(255, 253, 248, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 50%;
  box-shadow: inset 0 0 80px rgba(255, 255, 255, 0.12);
  display: flex;
  height: clamp(270px, 34vw, 430px);
  justify-content: center;
  width: clamp(270px, 34vw, 430px);
}

.pantry-preview {
  animation: floatCard 5s ease-in-out infinite;
  background: rgba(255, 253, 248, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 8px;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.22);
  max-width: 300px;
  padding: 18px;
  width: 74%;
}

.preview-header {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}

.preview-header span {
  background: var(--clay);
  border-radius: 999px;
  height: 8px;
  opacity: 0.8;
  width: 8px;
}

.preview-row {
  align-items: center;
  border: 1px solid rgba(36, 63, 45, 0.11);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding: 12px;
}

.preview-row strong {
  color: var(--forest);
  font-size: 0.88rem;
}

.preview-row span {
  border-radius: 999px;
  color: var(--ink);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 5px 9px;
}

.preview-row.fresh span {
  background: #dff0e1;
}

.preview-row.warning span {
  background: #fde3bd;
}

.preview-row.donate span {
  background: var(--sky);
}

.badge {
  animation: softBounce 4.6s ease-in-out infinite;
  background: rgba(255, 253, 248, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
  color: var(--forest);
  font-size: 0.88rem;
  font-weight: 800;
  padding: 12px 16px;
  position: absolute;
}

.users {
  align-items: center;
  background: var(--forest);
  border-radius: 50%;
  color: white;
  display: flex;
  flex-direction: column;
  height: 104px;
  justify-content: center;
  right: 8%;
  top: 10%;
  width: 104px;
}

.users h3 {
  font-size: 1.65rem;
  margin: 0;
}

.users p {
  margin: 0;
}

.review {
  bottom: 16%;
  left: 6%;
}

/* ABOUT SECTION */
.about-section,
.why-section,
.features-section,
.mission-section {
  scroll-margin-top: 96px;
}

.about-section {
  align-items: center;
  background:
    radial-gradient(circle at top left, rgba(122, 158, 126, 0.16), transparent 34%), var(--surface);
  display: grid;
  gap: clamp(36px, 6vw, 76px);
  grid-template-columns: minmax(0, 0.85fr) minmax(300px, 1.15fr);
  padding: clamp(76px, 10vw, 126px) clamp(24px, 7vw, 92px);
}

.about-left {
  max-width: 560px;
}

.about-left h2,
.why-right h2,
.section-heading h2,
.mission-copy h2 {
  color: var(--forest);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.05rem, 4vw, 3.7rem);
  letter-spacing: 0;
  line-height: 1.05;
  margin: 0 0 20px;
  text-wrap: balance;
}

.about-left p,
.why-right p,
.feature-card p,
.mission-copy p,
.mission-panel span {
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.75;
}

.about-right {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.about-card {
  background: rgba(255, 253, 248, 0.86);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 18px 48px rgba(36, 63, 45, 0.07);
  min-height: 168px;
  padding: 26px;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.about-card:nth-child(3) {
  grid-column: span 2;
}

.about-card:hover,
.feature-card:hover {
  border-color: rgba(196, 114, 74, 0.42);
  box-shadow: 0 24px 60px rgba(36, 63, 45, 0.11);
  transform: translateY(-6px);
}

.about-card h3 {
  color: var(--forest);
  font-size: 1.08rem;
  margin: 0 0 10px;
}

.about-card p {
  color: var(--muted);
  line-height: 1.6;
  margin: 0;
}

/* WHY SECTION */
.why-section {
  align-items: center;
  background: linear-gradient(180deg, var(--surface) 0%, #f0f7f2 100%);
  display: grid;
  gap: clamp(40px, 7vw, 90px);
  grid-template-columns: minmax(300px, 1fr) minmax(0, 0.95fr);
  padding: clamp(76px, 10vw, 124px) clamp(24px, 7vw, 92px);
}

.why-left {
  position: relative;
}

.why-left::before {
  background: var(--amber);
  border-radius: 8px;
  content: '';
  inset: 26px -18px -18px 26px;
  opacity: 0.35;
  position: absolute;
}

.why-left img {
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  box-shadow: 0 28px 70px rgba(36, 63, 45, 0.16);
  display: block;
  object-fit: cover;
  position: relative;
  width: 100%;
}

.why-right {
  max-width: 600px;
}

.why-right ul {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  list-style: none;
  margin: 24px 0 0;
  padding: 0;
}

.why-right li {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(74, 112, 80, 0.16);
  border-radius: 8px;
  color: var(--forest);
  font-weight: 800;
  padding: 13px 14px;
}

/* FEATURES */
.features-section {
  background: var(--forest);
  color: #fff;
  padding: clamp(78px, 10vw, 126px) clamp(24px, 7vw, 92px);
}

.section-heading {
  align-items: end;
  display: flex;
  gap: 28px;
  justify-content: space-between;
  margin-bottom: 42px;
}

.section-heading h2 {
  color: #fffdf8;
  margin-bottom: 0;
  max-width: 760px;
}

.feature-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.feature-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  min-height: 260px;
  padding: 26px;
  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    transform 0.25s ease;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.12);
}

.feature-icon {
  color: var(--amber);
  display: block;
  font-size: 0.84rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  margin-bottom: 58px;
}

.feature-card h3 {
  color: #fffdf8;
  font-size: 1.2rem;
  margin: 0 0 12px;
}

.feature-card p {
  color: rgba(255, 253, 248, 0.75);
  margin: 0;
}

/* MISSION */
.mission-section {
  align-items: center;
  background:
    linear-gradient(135deg, rgba(220, 234, 240, 0.7), rgba(255, 253, 248, 0.92)), var(--surface);
  display: grid;
  gap: clamp(36px, 7vw, 90px);
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.82fr);
  padding: clamp(76px, 10vw, 124px) clamp(24px, 7vw, 92px);
}

.mission-copy {
  max-width: 680px;
}

.mission-panel {
  background: #fffdf8;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 22px 60px rgba(36, 63, 45, 0.12);
  display: grid;
  gap: 0;
  overflow: hidden;
}

.mission-panel div {
  display: grid;
  gap: 5px;
  padding: 24px;
}

.mission-panel div + div {
  border-top: 1px solid var(--border);
}

.mission-panel strong {
  color: var(--forest);
  font-size: 1.08rem;
}

/* INITIAL STATE */
.fade-up,
.fade-left,
.fade-right {
  opacity: 0;
  transition:
    opacity 0.8s ease,
    transform 0.8s ease;
}

.fade-up {
  transform: translateY(42px);
}

.fade-left {
  transform: translateX(-42px);
}

.fade-right {
  transform: translateX(42px);
}

.show {
  opacity: 1;
  transform: translate(0, 0);
}

/* ANIMATIONS */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes floatCard {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-12px);
  }
}

@keyframes softBounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 0.7s ease,
    transform 0.7s ease;
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* HAMBURGER */
.hamburger {
  cursor: pointer;
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 4px;
}

.hamburger span {
  background: var(--surface-soft);
  border-radius: 2px;
  display: block;
  height: 2px;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  width: 24px;
}

.hamburger.active span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

@media (max-width: 1040px) {
  .hero {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .hero-right {
    margin-top: 30px;
    min-height: 340px;
  }

  .about-section,
  .why-section,
  .mission-section {
    grid-template-columns: 1fr;
  }

  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  nav {
    padding-inline: 20px;
  }

  .nav-links {
    background: rgba(255, 253, 248, 0.97);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 20px 45px rgba(36, 63, 45, 0.14);
    display: grid;
    gap: 0;
    left: 20px;
    opacity: 0;
    padding: 8px;
    pointer-events: none;
    position: absolute;
    right: 20px;
    top: 74px;
    transform: translateY(-10px);
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }

  .nav-links.active {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  .nav-links a {
    display: block;
    padding: 14px 12px;
  }

  .nav-links a::after {
    display: none;
  }

  .nav-cta {
    display: flex;
  }

  .hamburger {
    display: flex;
  }

  .mobile-auth {
    background: rgba(255, 253, 248, 0.97);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 20px 45px rgba(36, 63, 45, 0.14);
    left: 20px;
    opacity: 0;
    padding: 12px 16px;
    pointer-events: none;
    position: absolute;
    right: 20px;
    top: 120px;
    transform: translateY(-10px);
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }

  .mobile-auth.active {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  .mobile-user-greeting {
    color: var(--forest);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .hero {
    background-position: 58% center;
    padding-top: 112px;
  }

  .hero-left h1 {
    font-size: clamp(3rem, 16vw, 4.8rem);
  }

  .about-right,
  .why-right ul,
  .feature-grid {
    grid-template-columns: 1fr;
  }

  .about-card:nth-child(3) {
    grid-column: auto;
  }

  .section-heading {
    align-items: start;
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  .hero-right {
    min-height: 285px;
  }

  .hero-orbit {
    height: 260px;
    width: 260px;
  }

  .pantry-preview {
    width: 82%;
  }

  .users {
    height: 86px;
    right: 0;
    top: 4%;
    width: 86px;
  }

  .review {
    bottom: 10%;
    left: 0;
  }

  .about-section,
  .why-section,
  .features-section,
  .mission-section {
    padding-inline: 20px;
  }
}

.logo-image {
  display: block;
  width: min(100%, 175px);
  height: auto;
}

/* STATISTICS SECTION */
.stats-section {
  background: var(--surface-soft);
  padding: clamp(76px, 10vw, 124px) clamp(24px, 7vw, 92px);
  text-align: center;
}

.stats-container {
  max-width: 1100px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  margin-top: 54px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-num {
  color: var(--clay);
  font-family: Georgia, serif;
  font-size: clamp(1rem, 3vw, 4rem);
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  color: var(--muted);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stats-source {
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 2rem;
  opacity: 0.8;
}

/* HOW TO USE SECTION */
.howto-section {
  padding: clamp(76px, 10vw, 124px) clamp(24px, 7vw, 92px);
  background: var(--surface);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-top: 50px;
}

.step-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 40px 30px;
  position: relative;
  transition: transform 0.3s ease;
}

.step-card:hover {
  transform: translateY(-8px);
  border-color: var(--ink);
}

.step-number {
  background: var(--forest);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 3.1rem;
  margin-bottom: 24px;
}

.step-card h3 {
  color: var(--forest);
  margin: 0 0 12px;
  font-size: 1.25rem;
}

.step-card p {
  color: var(--muted);
  line-height: 1.6;
  margin: 0;
}

/* CTA SECTION */
.cta-section {
  padding: clamp(60px, 8vw, 100px) 24px;
  background: var(--surface);
}

.cta-content {
  background: var(--forest);
  background-image: radial-gradient(circle at top right, var(--deep-sage), transparent);
  border-radius: 24px;
  color: white;

  margin: 0 auto;
  padding: clamp(40px, 8vw, 80px) 30px;
  text-align: center;
  box-shadow: 0 30px 60px rgba(36, 63, 45, 0.2);
}

.cta-content h2 {
  font-family: Georgia, serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  margin: 0 0 20px;
}

.cta-content p {
  font-size: clamp(1rem, 1.2vw, 1.2rem);
  color: rgba(255, 253, 248, 0.8);
  margin-bottom: 40px;
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-btn-large {
  padding: 16px 40px;
  font-size: 1.1rem;
}

/* FOOTER */
.footer {
  background: var(--surface-soft);
  border-top: 1px solid var(--border);
  padding: 80px clamp(24px, 7vw, 92px) 40px;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-brand {
  margin-bottom: 50px;
}

.logo-image.small {
  width: 140px;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 40px;
  margin-bottom: 60px;
}

.link-group h4 {
  color: var(--forest);
  font-size: 1rem;
  margin: 0 0 20px;
  font-weight: 700;
}

.link-group a {
  display: block;
  color: var(--muted);
  text-decoration: none;
  margin-bottom: 12px;
  font-size: 0.95rem;
  transition: color 0.2s ease;
}

.link-group a:hover {
  color: var(--clay);
}

.footer-bottom {
  border-top: 1px solid var(--border);
  padding-top: 30px;
  text-align: center;
}

.footer-bottom p {
  color: var(--muted);
  font-size: 0.85rem;
}

/* RESPONSIVE TWEAKS */
@media (max-width: 640px) {
  .cta-buttons {
    flex-direction: column;
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
