import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: () => import('@/pages/DashboardPage.vue') },
    { path: '/devices', component: () => import('@/pages/DevicesPage.vue') },
    { path: '/device-control', component: () => import('@/pages/DeviceControlPage.vue') },
    { path: '/sensors', component: () => import('@/pages/SensorsPage.vue') },
    { path: '/profile', component: () => import('@/pages/ProfilePage.vue') },
  ],
})

export default router
