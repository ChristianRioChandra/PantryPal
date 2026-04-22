<template>
  <aside class="right-sidebar">
    <div class="right-box">
      <div class="bulk-select-controls">
        <span class="selection-count">{{ quickActionsTitle }}</span>
      </div>
      <slot name="quick-actions">
        <button class="right-btn" @click="$emit('add-food')"><i class="bi bi-plus-circle"></i> Add Food Item</button>
        <button class="right-btn" @click="$emit('donate-items')"><i class="bi bi-heart"></i> Donate Items</button>
        <button class="right-btn" @click="$emit('plan-meal')"><i class="bi bi-calendar-plus"></i> Plan Meal</button>
      </slot>
    </div>

    <div class="right-box">
      <slot name="stats">
        <div class="stat-item">
          <span>Total items</span>
          <strong>{{ totalItems }}</strong>
        </div>
        <div class="stat-item">
          <span>Expiring soon</span>
          <strong class="warning">{{ expiringSoon }}</strong>
        </div>
      </slot>
    </div>

    <slot name="extra"></slot>
  </aside>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  quickActionsTitle?: string
  totalItems?: number
  expiringSoon?: number
}>(), {
  quickActionsTitle: 'Quick Actions',
  totalItems: 0,
  expiringSoon: 0,
})

defineEmits<{
  (e: 'add-food'): void
  (e: 'donate-items'): void
  (e: 'plan-meal'): void
}>()
</script>

<style scoped>
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: sticky;
  top: 24px;
}

.right-box {
  background: white;
  border-radius: 28px;
  padding: 20px;
  box-shadow: 0 16px 42px rgba(31, 47, 62, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.selection-count {
  background: #eef2ff;
  padding: 8px 16px;
  border-radius: 40px;
  font-size: 0.82rem;
  font-weight: 600;
  align-self: flex-start;
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

.stat-item .warning {
  color: #d97706;
}
</style>