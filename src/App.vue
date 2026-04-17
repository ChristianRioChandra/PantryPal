<!-- App.vue -->
<template>
  <manageInventory />
</template>

<script setup lang="ts">
import manageInventory from './views/ManageInventory.vue' // Adjust path as needed
// import { RouterView } from 'vue-router'
</script>

<style scoped>
html,
body,
#app {
  width: 100%;
  min-height: 100%;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background: var(--color-background-tertiary);
}
</style>
