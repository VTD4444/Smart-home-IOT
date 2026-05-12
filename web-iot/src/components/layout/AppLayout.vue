<template>
  <div class="app-shell">
    <AppHeader />
    <main class="container">
      <slot />
    </main>
    <BaseToastStack />
  </div>
</template>

<script setup lang="ts">
import BaseToastStack from '@/components/base/BaseToastStack.vue'
import AppHeader from './AppHeader.vue'
</script>

<style scoped>
.app-shell {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  max-width: 1240px;
  width: 100%;
  margin: 0 auto;
  padding: 12px 16px 14px;
  overflow: hidden;
}

@media (max-width: 767px) {
  .container {
    overflow: auto;
  }
}
</style>
