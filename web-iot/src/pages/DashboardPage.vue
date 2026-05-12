<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { storeToRefs } from 'pinia'
import ActiveDevicesPanel from '@/components/dashboard/ActiveDevicesPanel.vue'
import type { ActiveDeviceRow } from '@/components/dashboard/ActiveDevicesPanel.vue'
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard.vue'
import { useIoTRealtime } from '@/composables/useIoTRealtime'
import { useIotStore, ALL_DEVICE_IDS, type DeviceId } from '@/stores/iot'

type SensorMetricId = 'temperature' | 'humidity' | 'light' | 'motion'

const iot = useIotStore()
const { deviceStates, motionBarSamples, motionBarValues, motionBarKeys } = storeToRefs(iot)
const { sendControl } = useIoTRealtime()

const pendingIntent = reactive<Partial<Record<DeviceId, boolean>>>({})

/** Event-based: đếm số lần phát hiện motion trong 1h gần nhất (chỉ tính cạnh 0->1). */
const motionEventsPerHour = computed(() => {
  const now = Date.now()
  const hourAgo = now - 60 * 60 * 1000
  return motionBarSamples.value.filter((x) => x.v > 0.5 && x.at >= hourAgo).length
})

const metrics = [
  {
    key: 'temperature' as const,
    title: 'Temperature',
    location: 'Living Room',
    icon: 'thermo' as const,
    line: '#3b82f6',
    fill: '#60a5fa',
    soft: '#e0f2fe',
    border: '#2563eb',
    yUnit: '°C',
    yDecimals: 1,
    variant: 'area' as const,
  },
  {
    key: 'humidity' as const,
    title: 'Humidity',
    location: 'Whole House',
    icon: 'drop' as const,
    line: '#2563eb',
    fill: '#3b82f6',
    soft: '#dbeafe',
    border: '#1d4ed8',
    yUnit: '%',
    yDecimals: 0,
    variant: 'area' as const,
  },
  {
    key: 'light' as const,
    title: 'Ambient Light',
    location: 'Exterior',
    icon: 'sun' as const,
    line: '#f59e0b',
    fill: '#fbbf24',
    soft: '#fffbeb',
    border: '#d97706',
    yUnit: ' Lux',
    yDecimals: 0,
    variant: 'area' as const,
  },
  {
    key: 'motion' as const,
    title: 'Motion Activity',
    location: 'Hallway',
    icon: 'motion' as const,
    line: '#ec4899',
    fill: '#db2777',
    soft: '#fce7f3',
    border: '#db2777',
    yUnit: '',
    yDecimals: 0,
    variant: 'bar' as const,
  },
]

const chartHeightPx = 108

function formatValue(key: SensorMetricId, v: number): string {
  if (key === 'temperature') return `${v.toFixed(1)}°C`
  if (key === 'humidity') return `${v.toFixed(0)}%`
  if (key === 'light') return `${Math.round(v)} lx`
  return `${motionEventsPerHour.value} events/p`
}

function isToggleOn(key: DeviceId): boolean {
  const s = iot.deviceStates[key]
  if (s === 'loading' && pendingIntent[key] !== undefined) {
    return pendingIntent[key]!
  }
  return s === 'active'
}

function onToggle(key: DeviceId, next: boolean) {
  pendingIntent[key] = next
  sendControl({ deviceId: key, action: next ? 'ON' : 'OFF' })
}

watch(
  deviceStates,
  (states) => {
    const keys: DeviceId[] = [...ALL_DEVICE_IDS]
    for (const key of keys) {
      const s = states[key]
      if ((s === 'active' || s === 'inactive') && pendingIntent[key] !== undefined) {
        delete pendingIntent[key]
      }
      if (s === 'error') {
        delete pendingIntent[key]
      }
    }
  },
  { deep: true },
)

/** Màu accent gợi nhóm cảm biến liên quan (không dùng slug cảm biến làm tên thiết bị) */
const accentByDevice: Record<DeviceId, { line: string; soft: string; border: string }> = {
  fan: { line: '#3b82f6', soft: '#e0f2fe', border: '#2563eb' },
  dehumidifier: { line: '#2563eb', soft: '#dbeafe', border: '#1d4ed8' },
  living_room_light: { line: '#f59e0b', soft: '#fffbeb', border: '#d97706' },
  alarm_siren: { line: '#ec4899', soft: '#fce7f3', border: '#db2777' },
  aux_led: { line: '#0ea5e9', soft: '#cffafe', border: '#0284c7' },
}

const devicePanelRows = computed<ActiveDeviceRow[]>(() => {
  const meta: Record<DeviceId, { name: string }> = {
    fan: { name: 'Ceiling Fan' },
    dehumidifier: { name: 'Dehumidifier' },
    living_room_light: { name: 'Living Room Light' },
    alarm_siren: { name: 'Alarm Siren' },
    aux_led: { name: 'Aux LED' },
  }
  const order: DeviceId[] = [...ALL_DEVICE_IDS]
  return order.map((key) => {
    const m = accentByDevice[key]
    const s = iot.deviceStates[key]
    const on = isToggleOn(key)
    let statusLine = 'OFF'
    if (s === 'loading') statusLine = 'Applying…'
    else if (s === 'error') statusLine = 'Error — check hardware'
    else if (s === 'timeout') statusLine = 'No response'
    else if (on) {
      if (key === 'living_room_light') statusLine = 'ON • Bright'
      else if (key === 'alarm_siren') statusLine = 'Armed'
      else statusLine = 'ON'
    } else if (key === 'dehumidifier') statusLine = 'Standby'
    else if (key === 'alarm_siren') statusLine = 'Idle'
    else if (key === 'aux_led') statusLine = 'Ready'

    return {
      key,
      name: meta[key].name,
      statusLine,
      loading: s === 'loading',
      on,
      accent: m.line,
      accentSoft: m.soft,
      borderColor: m.border,
      highlight: (key === 'living_room_light' || key === 'aux_led') && on,
    }
  })
})

onMounted(() => {
  void iot.loadInit()
})
</script>

<template>
  <section class="dashboard page-frame">
    <div class="dash-grid">
      <div class="metrics-grid">
        <DashboardMetricCard v-for="m in metrics" :key="m.key" :title="m.title" :location="m.location"
          :value-text="formatValue(m.key, iot.sensorValues[m.key])" :icon="m.icon" :line="m.line" :fill="m.fill"
          :soft="m.soft" :border="m.border" :chart-uid="m.key"
          :chart-values="m.key === 'motion' ? motionBarValues : iot.sensorSeries[m.key]" :chart-variant="m.variant"
          :chart-height-px="chartHeightPx" :y-unit="m.yUnit" :y-decimals="m.yDecimals"
          :motion-binary="m.key === 'motion'" :bar-keys="m.key === 'motion' ? motionBarKeys : undefined" />
      </div>
      <ActiveDevicesPanel :rows="devicePanelRows" @toggle="onToggle" />
    </div>
  </section>
</template>

<style scoped>
.dashboard {
  min-height: 0;
}

.dash-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(252px, 0.36fr);
  gap: 14px;
  align-items: stretch;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  min-height: 0;
}

@media (max-width: 1024px) {
  .dash-grid {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .metrics-grid {
    min-height: 360px;
  }
}

@media (max-width: 640px) {
  .metrics-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }
}
</style>
