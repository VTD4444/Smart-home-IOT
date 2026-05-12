<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BasePaginatedTable from '@/components/base/BasePaginatedTable.vue'
import BaseRefreshButton from '@/components/base/BaseRefreshButton.vue'
import BaseSearchFilterCard from '@/components/base/BaseSearchFilterCard.vue'
import type { FilterChip } from '@/components/base/BaseSearchFilterCard.vue'
import { getSensorsHistory } from '@/api/iotApi'

const loading = ref(false)
/** Nhập liệu trong ô search (chưa gửi API) */
const searchDraft = ref('')
/** Giá trị search đã áp dụng (Enter / nút Search) */
const searchApplied = ref('')
const activeFilter = ref('')
const start = ref('')
const end = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const rows = ref<Record<string, unknown>[]>([])

const filters: FilterChip[] = [
  { key: '', label: 'All Sensors', icon: 'all' },
  { key: 'temperature', label: 'Temperature', icon: 'temperature' },
  { key: 'humidity', label: 'Humidity', icon: 'humidity' },
  { key: 'light', label: 'Light', icon: 'light' },
  { key: 'motion', label: 'Motion', icon: 'motion' },
]

const columns = computed(() => [
  { key: 'id', label: 'ID' },
  { key: 'sensor', label: 'Sensor name' },
  { key: 'value', label: 'Value' },
  { key: 'timestamp', label: 'Timestamp' },
])

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      limit: String(limit.value),
      ...(searchApplied.value ? { search: searchApplied.value } : {}),
      ...(activeFilter.value ? { type: activeFilter.value } : {}),
      ...(start.value ? { start: new Date(start.value).toISOString() } : {}),
      ...(end.value ? { end: new Date(end.value).toISOString() } : {}),
    })
    const data = await getSensorsHistory(params)
    total.value = data.total
    rows.value = data.items.map((item) => {
      const name = String(item.sensors?.name ?? '')
      const num = Number(item.value)
      return {
        id: item.id,
        sensor: name,
        valueNum: num,
        value: Number.isFinite(num) ? num.toFixed(2) : String(item.value),
        timestamp: new Date(item.create_at).toLocaleString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
      }
    })
  } finally {
    loading.value = false
  }
}

watch([activeFilter, start, end, page, limit], () => void load())

function applySearch() {
  searchApplied.value = searchDraft.value.trim()
  page.value = 1
  void load()
}

onMounted(() => void load())

const tableEmptyHint = computed(() =>
  searchApplied.value
    ? 'No rows match your search. Try ID, value, sensor name, or copy exact Timestamp from a row (e.g. 13/04/2026, 16:30:45).'
    : 'Readings will show here when your hardware sends data to the backend.',
)

function sensorLabel(key: string) {
  const m: Record<string, string> = {
    temperature: 'Temperature',
    humidity: 'Humidity',
    light: 'Light',
    motion: 'Motion',
  }
  return m[key] ?? key
}
</script>

<template>
  <section class="page-frame">
    <BaseSearchFilterCard v-model:search="searchDraft" v-model:active-filter="activeFilter" v-model:start="start"
      v-model:end="end" primary-filters-label="Sensor" :filters="filters" @apply-search="applySearch">
      <template #actions>
        <BaseRefreshButton variant="icon" :loading="loading" @click="load" />
      </template>
    </BaseSearchFilterCard>

    <BasePaginatedTable :columns="columns" :rows="rows" :page="page" :total="total" :limit="limit" :loading="loading"
      empty-title="No sensor readings" :empty-hint="tableEmptyHint" @update:page="page = $event"
      @update:limit="limit = $event">
      <template #cell-id="{ value }">
        <span class="mono cell-id">#{{ value }}</span>
      </template>
      <template #cell-sensor="{ value }">
        <div class="sensor-cell">
          <span class="sensor-cell__icon" :class="`sensor-cell__icon--${value}`">
            <svg v-if="value === 'temperature'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v13.5a4 4 0 1 0 4-4V7" stroke-linecap="round" />
            </svg>
            <svg v-else-if="value === 'humidity'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2">
              <path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="value === 'light'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"
                stroke-linecap="round" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3a4 4 0 0 1 4 4v7H8V7a4 4 0 0 1 4-4Z" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="sensor-cell__label">{{ sensorLabel(String(value)) }}</span>
        </div>
      </template>
      <template #cell-value="{ row }">
        <template v-if="row.sensor === 'motion'">
          <span class="motion-pill" :class="Number(row.valueNum) > 0.5 ? 'motion-pill--on' : 'motion-pill--off'">
            {{ Number(row.valueNum) > 0.5 ? 'Detected' : 'Clear' }}
          </span>
        </template>
        <span v-else class="value-text" :class="{
          'value-text--temp': row.sensor === 'temperature',
          'value-text--hum': row.sensor === 'humidity',
          'value-text--lux': row.sensor === 'light',
        }">
          {{ row.value }}
          <template v-if="row.sensor === 'temperature'"> °C</template>
          <template v-else-if="row.sensor === 'humidity'"> %</template>
          <template v-else-if="row.sensor === 'light'"> Lux</template>
        </span>
      </template>
    </BasePaginatedTable>
  </section>
</template>

<style scoped>
.page-frame {
  overflow: hidden;
}

.top {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.mono {
  font-variant-numeric: tabular-nums;
}

.cell-id {
  font-weight: 700;
  color: #475569;
}

.sensor-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sensor-cell__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.sensor-cell__icon svg {
  width: 22px;
  height: 22px;
}

.sensor-cell__icon--temperature {
  background: linear-gradient(145deg, #fee2e2, #fecaca);
  color: #dc2626;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.12);
}

.sensor-cell__icon--humidity {
  background: linear-gradient(145deg, #dbeafe, #bfdbfe);
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
}

.sensor-cell__icon--light {
  background: linear-gradient(145deg, #fef3c7, #fde68a);
  color: #d97706;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.12);
}

.sensor-cell__icon--motion {
  background: linear-gradient(145deg, #ede9fe, #ddd6fe);
  color: #7c3aed;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.12);
}

.sensor-cell__label {
  font-weight: 600;
  color: #0f172a;
}

.value-text {
  font-weight: 700;
}

.value-text--temp {
  color: #2563eb;
}

.value-text--hum {
  color: #1d4ed8;
}

.value-text--lux {
  color: #ea580c;
}

.motion-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  transition: transform 0.2s ease;
}

.motion-pill--on {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border: 1px solid #93c5fd;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.motion-pill--off {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}
</style>
