<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getDeviceActionsDailyStats } from '@/api/iotApi'

const statsLoading = ref(false)
const statsDays = ref<string[]>([])
const statsSeries = ref<
  Array<{
    device: string
    on: number[]
    off: number[]
    total: number[]
  }>
>([])

const statsStart = ref('')
const statsEnd = ref('')
const viewMode = ref<'total' | 'on' | 'off'>('total')
const deviceOrder = ['fan', 'dehumidifier', 'living_room_light', 'alarm_siren', 'aux_led'] as const
type DeviceKey = (typeof deviceOrder)[number]

const deviceColor: Record<string, string> = {
  fan: '#ef4444',
  dehumidifier: '#2563eb',
  living_room_light: '#f59e0b',
  alarm_siren: '#db2777',
  aux_led: '#0ea5e9',
}

const chartWidth = 720
const chartHeight = 220
const chartPadding = { left: 36, right: 14, top: 10, bottom: 24 }
const chartInnerWidth = computed(() => chartWidth - chartPadding.left - chartPadding.right)
const chartInnerHeight = computed(() => chartHeight - chartPadding.top - chartPadding.bottom)
const normalizedSeries = computed<Array<{ device: DeviceKey; on: number[]; off: number[]; total: number[] }>>(() =>
  deviceOrder.map((device) => {
    const hit = statsSeries.value.find((s) => s.device === device)
    const on = statsDays.value.map((_, idx) => Number(hit?.on?.[idx] ?? 0))
    const off = statsDays.value.map((_, idx) => Number(hit?.off?.[idx] ?? 0))
    const total = statsDays.value.map((_, idx) => Number(hit?.total?.[idx] ?? 0))
    return { device, on, off, total }
  }),
)

function pickValue(
  row: { on: number[]; off: number[]; total: number[] },
  idx: number,
  mode: 'total' | 'on' | 'off',
) {
  if (mode === 'on') return row.on[idx] ?? 0
  if (mode === 'off') return row.off[idx] ?? 0
  return row.total[idx] ?? 0
}
const chartMaxY = computed(() => {
  const max = Math.max(
    0,
    ...normalizedSeries.value.flatMap((s) =>
      statsDays.value.map((_, idx) => pickValue(s, idx, viewMode.value)),
    ),
  )
  return max > 0 ? max : 1
})
const axisTicks = computed(() => {
  const max = chartMaxY.value
  return [0, 0.25, 0.5, 0.75, 1].map((r) => {
    const value = Math.round(max * r)
    const y = chartPadding.top + chartInnerHeight.value - r * chartInnerHeight.value
    return { value, y }
  })
})
const dayBandWidth = computed(() =>
  statsDays.value.length ? chartInnerWidth.value / statsDays.value.length : chartInnerWidth.value,
)
const groupWidthRatio = 0.8
const groupWidth = computed(() => dayBandWidth.value * groupWidthRatio)
const barGap = 2
const barWidth = computed(() => {
  const totalGap = (deviceOrder.length - 1) * barGap
  return Math.max((groupWidth.value - totalGap) / deviceOrder.length, 2.2)
})
function groupX(index: number) {
  const start = chartPadding.left + index * dayBandWidth.value
  return start + (dayBandWidth.value - groupWidth.value) / 2
}
function barX(dayIdx: number, deviceIdx: number) {
  return groupX(dayIdx) + deviceIdx * (barWidth.value + barGap)
}
function barHeight(value: number) {
  return (value / chartMaxY.value) * chartInnerHeight.value
}
function barY(value: number) {
  return chartPadding.top + chartInnerHeight.value - barHeight(value)
}
function dayTickX(index: number) {
  return groupX(index) + groupWidth.value / 2
}
function dayLabel(day: string) {
  const d = new Date(`${day}T00:00:00`)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
function deviceLabel(key: string) {
  const m: Record<string, string> = {
    fan: 'Ceiling Fan',
    dehumidifier: 'Dehumidifier',
    living_room_light: 'Living Room Light',
    alarm_siren: 'Alarm Siren',
    aux_led: 'Aux LED',
  }
  return m[key] ?? key
}

async function loadDailyStats() {
  statsLoading.value = true
  try {
    const params = new URLSearchParams()
    if (statsStart.value) params.set('start', new Date(`${statsStart.value}T00:00:00`).toISOString())
    if (statsEnd.value) params.set('end', new Date(`${statsEnd.value}T23:59:59`).toISOString())
    const data = await getDeviceActionsDailyStats(params)
    statsDays.value = data.days
    statsSeries.value = data.series
  } finally {
    statsLoading.value = false
  }
}

onMounted(() => {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 6)
  statsStart.value = start.toISOString().slice(0, 10)
  statsEnd.value = today.toISOString().slice(0, 10)
  void loadDailyStats()
})
</script>

<template>
  <section class="page-frame">
    <article class="daily-card">
      <div class="daily-card__head">
        <div>
          <h2 class="daily-card__title">Daily Toggle Chart (5 devices)</h2>
          <p class="daily-card__hint">Counts ON/OFF actions per day for all devices</p>
        </div>
        <div class="daily-card__filters">
          <label class="date-field">
            <span>From</span>
            <input v-model="statsStart" type="date" />
          </label>
          <label class="date-field">
            <span>To</span>
            <input v-model="statsEnd" type="date" />
          </label>
          <button class="apply-btn" type="button" :disabled="statsLoading" @click="loadDailyStats">
            {{ statsLoading ? 'Loading…' : 'Apply' }}
          </button>
        </div>
      </div>
      <div class="view-toggle" role="group" aria-label="Chart view mode">
        <button type="button" class="view-toggle__btn" :class="{ 'view-toggle__btn--active': viewMode === 'total' }"
          @click="viewMode = 'total'">
          Total
        </button>
        <button type="button" class="view-toggle__btn" :class="{ 'view-toggle__btn--active': viewMode === 'on' }"
          @click="viewMode = 'on'">
          ON
        </button>
        <button type="button" class="view-toggle__btn" :class="{ 'view-toggle__btn--active': viewMode === 'off' }"
          @click="viewMode = 'off'">
          OFF
        </button>
      </div>
      <div class="daily-legend">
        <span v-for="serie in normalizedSeries" :key="serie.device" class="legend-item">
          <i :style="{ background: deviceColor[serie.device] ?? '#64748b' }" />
          {{ deviceLabel(serie.device) }}
        </span>
      </div>
      <div v-if="statsDays.length" class="daily-chart-wrap">
        <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="daily-chart" preserveAspectRatio="xMidYMid meet">
          <line
            v-for="tick in axisTicks"
            :key="`grid-${tick.y}`"
            :x1="chartPadding.left"
            :x2="chartWidth - chartPadding.right"
            :y1="tick.y"
            :y2="tick.y"
            class="chart-grid"
          />
          <text
            v-for="tick in axisTicks"
            :key="`tick-${tick.y}`"
            :x="chartPadding.left - 8"
            :y="tick.y + 4"
            class="chart-y-text"
          >
            {{ tick.value }}
          </text>
          <g v-for="(day, dayIdx) in statsDays" :key="`bars-${day}`">
            <rect
              v-for="(serie, deviceIdx) in normalizedSeries"
              :key="`${day}-${serie.device}`"
              :x="barX(dayIdx, deviceIdx)"
              :y="barY(pickValue(serie, dayIdx, viewMode))"
              :width="barWidth"
              :height="barHeight(pickValue(serie, dayIdx, viewMode))"
              :fill="deviceColor[serie.device] ?? '#64748b'"
              class="chart-bar"
              rx="1.6"
            />
          </g>
          <text
            v-for="(day, idx) in statsDays"
            :key="`day-${day}`"
            :x="dayTickX(idx)"
            :y="chartHeight - 6"
            class="chart-x-text"
          >
            {{ dayLabel(day) }}
          </text>
        </svg>
      </div>
      <p v-else class="daily-empty">No daily toggle data in selected date range.</p>
    </article>
  </section>
</template>

<style scoped>
.page-frame {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.daily-card {
  height: 100%;
  min-height: 0;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.daily-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.daily-card__title {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

.daily-card__hint {
  margin: 3px 0 0;
  font-size: 12px;
  color: #64748b;
}

.daily-card__filters {
  display: flex;
  gap: 8px;
  align-items: end;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11px;
  color: #475569;
}

.date-field input {
  height: 30px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 12px;
}

.apply-btn {
  height: 30px;
  border: none;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  cursor: pointer;
}

.apply-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.daily-legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.view-toggle {
  display: inline-flex;
  gap: 6px;
  align-self: flex-start;
}

.view-toggle__btn {
  height: 28px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.view-toggle__btn--active {
  border-color: #2563eb;
  color: #1d4ed8;
  background: #dbeafe;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #334155;
}

.legend-item i {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.daily-chart-wrap {
  flex: 1;
  min-height: 220px;
}

.daily-chart {
  width: 100%;
  height: 100%;
}

.chart-grid {
  stroke: #e2e8f0;
  stroke-width: 1;
}

.chart-y-text {
  font-size: 11px;
  fill: #94a3b8;
  text-anchor: end;
}

.chart-x-text {
  font-size: 11px;
  fill: #64748b;
  text-anchor: middle;
}

.daily-empty {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

@media (max-width: 1024px) {
  .daily-card__head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
