<script setup lang="ts">
import DeviceToggle from '@/components/dashboard/DeviceToggle.vue'
import type { DeviceId } from '@/stores/iot'

export type ActiveDeviceKey = DeviceId

export type ActiveDeviceRow = {
  key: ActiveDeviceKey
  name: string
  statusLine: string
  loading: boolean
  on: boolean
  accent: string
  accentSoft: string
  borderColor: string
  highlight?: boolean
}

defineProps<{ rows: ActiveDeviceRow[] }>()

const emit = defineEmits<{
  'toggle': [key: ActiveDeviceKey, next: boolean]
}>()
</script>

<template>
  <aside class="panel">
    <header class="panel__head">
      <h2 class="panel__title">Active Devices</h2>
      <p class="panel__sub">Manage connected endpoints</p>
    </header>
    <ul class="list">
      <li v-for="row in rows" :key="row.key" class="row" :class="{ 'row--highlight': row.highlight }">
        <div class="row__icon" :class="`row__icon--${row.key}`">
          <svg v-if="row.key === 'fan'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M19.8 4.2L17 7M7 17l-2.8 2.8" stroke-linecap="round" />
          </svg>
          <svg v-else-if="row.key === 'living_room_light'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M9 18h6M10 22h4M12 2a6 6 0 0 1 3 11v3H9v-3a6 6 0 0 1 3-11Z" />
          </svg>
          <svg v-else-if="row.key === 'alarm_siren'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="7" y="10" width="10" height="9" rx="2" />
            <path d="M10 10V8a2 2 0 0 1 4 0v2" />
          </svg>
          <svg v-else-if="row.key === 'aux_led'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M9 18h6M10 22h4M12 2a6 6 0 0 1 3 11v3H9v-3a6 6 0 0 1 3-11Z" />
            <path d="M7 9h2M15 9h2" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="6" y="6" width="12" height="14" rx="2" />
            <path d="M9 10h6M9 14h4" stroke-linecap="round" />
          </svg>
        </div>
        <div class="row__text">
          <p class="row__name">{{ row.name }}</p>
          <p class="row__status">{{ row.statusLine }}</p>
        </div>
        <DeviceToggle :model-value="row.on" :disabled="row.loading" :loading="row.loading" :accent="row.accent"
          :accent-soft="row.accentSoft" :border-color="row.borderColor"
          @update:model-value="(v) => emit('toggle', row.key, v)" />
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 18px;
  border: 1px solid #eef2f7;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.07);
  padding: 16px 14px 14px;
}

.panel__head {
  flex-shrink: 0;
  margin-bottom: 12px;
}

.panel__title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.panel__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid #e8ecf2;
  background: #fafbfc;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.row--highlight {
  border-color: #fde68a;
  background: linear-gradient(135deg, #fffbeb 0%, #fff 55%);
  box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.35);
}

.row__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.row__icon svg {
  width: 22px;
  height: 22px;
}

.row__icon--fan {
  color: #ef5350;
}

.row__icon--dehumidifier {
  color: #1976d2;
}

.row__icon--living_room_light {
  color: #f59e0b;
}

.row__icon--alarm_siren {
  color: #8e24aa;
}

.row__icon--aux_led {
  color: #0ea5e9;
}

.row__text {
  flex: 1;
  min-width: 0;
}

.row__name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.row__status {
  margin: 2px 0 0;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}
</style>
