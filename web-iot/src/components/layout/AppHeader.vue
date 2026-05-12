<script setup lang="ts">
const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/device-control', label: 'Control' },
  { to: '/devices', label: 'Devices' },
  { to: '/sensors', label: 'Sensors' },
  { to: '/profile', label: 'Profile' },
]
</script>

<template>
  <header class="header card">
    <div class="brand">SmartHome</div>
    <nav class="nav">
      <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="nav-link">
        {{ link.label }}
      </RouterLink>
    </nav>
    <div class="avatar">D</div>
  </header>
</template>

<style scoped>
.header {
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px 0 16px;
  border-radius: 0;
}
.brand {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.02em;
}
.nav {
  display: flex;
  gap: 14px;
}
.nav-link {
  color: #6b7280;
  font-weight: 600;
  font-size: 13px;
}
.router-link-active {
  color: #2563eb;
}
.avatar {
  width: 28px;
  height: 28px;
  font-size: 12px;
  border-radius: 999px;
  background: #fde68a;
  display: grid;
  place-items: center;
  font-weight: 700;
}
</style>
