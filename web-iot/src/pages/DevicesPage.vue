<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BasePaginatedTable from '@/components/base/BasePaginatedTable.vue'
import BaseRefreshButton from '@/components/base/BaseRefreshButton.vue'
import BaseSearchFilterCard from '@/components/base/BaseSearchFilterCard.vue'
import type { FilterChip } from '@/components/base/BaseSearchFilterCard.vue'
import { getDeviceActionsHistory } from '@/api/iotApi'

const loading = ref(false)
const searchDraft = ref('')
const searchApplied = ref('')
const activeDeviceFilter = ref('')
const activeStatusFilter = ref('')
const start = ref('')
const end = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const rows = ref<Record<string, unknown>[]>([])

const deviceFilters: FilterChip[] = [
  { key: '', label: 'All', icon: 'all' },
  { key: 'fan', label: 'Ceiling Fan', icon: 'temperature' },
  { key: 'dehumidifier', label: 'Dehumidifier', icon: 'humidity' },
  { key: 'living_room_light', label: 'Living Room Light', icon: 'light' },
  { key: 'alarm_siren', label: 'Alarm Siren', icon: 'motion' },
  { key: 'aux_led', label: 'Aux LED', icon: 'light' },
]

const statusFilters: FilterChip[] = [
  { key: '', label: 'All', icon: 'all' },
  { key: 'active', label: 'Active', icon: 'active' },
  { key: 'inactive', label: 'Inactive', icon: 'inactive' },
  { key: 'timeout', label: 'Timeout', icon: 'timeout' },
]

const columns = computed(() => [
  { key: 'id', label: 'Action ID' },
  { key: 'device', label: 'Device name' },
  { key: 'action', label: 'Action' },
  { key: 'status', label: 'Status' },
  { key: 'timestamp', label: 'Timestamp' },
])

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      limit: String(limit.value),
      ...(searchApplied.value ? { search: searchApplied.value } : {}),
      ...(activeDeviceFilter.value ? { type: activeDeviceFilter.value } : {}),
      ...(activeStatusFilter.value ? { status: activeStatusFilter.value } : {}),
      ...(start.value ? { start: new Date(start.value).toISOString() } : {}),
      ...(end.value ? { end: new Date(end.value).toISOString() } : {}),
    })
    const data = await getDeviceActionsHistory(params)
    total.value = data.total
    rows.value = data.items.map((item) => {
      const actionDisplay = normalizeActionDisplay(String(item.action ?? ''), String(item.status ?? ''))
      return {
        id: item.id,
        device: item.devices?.name,
        action: actionDisplay,
        actionKind: actionBadgeKind(actionDisplay),
        status: String(item.status).toLowerCase(),
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

watch([activeDeviceFilter, activeStatusFilter, start, end, page, limit], () => void load())

function applySearch() {
  searchApplied.value = searchDraft.value.trim()
  page.value = 1
  void load()
}

onMounted(() => void load())

const tableEmptyHint = computed(() =>
  searchApplied.value
    ? 'No actions match your search. Try ID, keyword, or copy exact Timestamp from a row (e.g. 13/04/2026, 16:30:45).'
    : 'Manual and automatic device actions will appear here.',
)

/** Chuẩn hóa bản ghi cũ (action = manual/auto) + bản mới */
function normalizeActionDisplay(actionRaw: string, statusRaw: string): string {
  const a = actionRaw.trim()
  const status = statusRaw.toLowerCase()
  if (a === 'Turn On' || a === 'Turn Off' || a === 'No response') return a
  if (status === 'timeout') return 'No response'
  if (a === 'manual' || a === 'auto') {
    if (status === 'active') return 'Turn On'
    if (status === 'inactive') return 'Turn Off'
  }
  return a || '—'
}

function actionBadgeKind(display: string): 'on' | 'off' | 'noreply' | 'other' {
  if (display === 'Turn On') return 'on'
  if (display === 'Turn Off') return 'off'
  if (display === 'No response') return 'noreply'
  return 'other'
}

function deviceLabel(key: string) {
  const m: Record<string, string> = {
    fan: 'Ceiling Fan',
    dehumidifier: 'Dehumidifier',
    living_room_light: 'Living Room Light',
    alarm_siren: 'Alarm Siren',
    aux_led: 'Aux LED',
    // Backward compatibility for old slugs before DB migration
    quat: 'Ceiling Fan',
    may_hut_am: 'Dehumidifier',
    den_phong_khach: 'Living Room Light',
    bao_dong: 'Alarm Siren',
    den_led_phu: 'Aux LED',
    temperature: 'Ceiling Fan',
    humidity: 'Dehumidifier',
    light: 'Living Room Light',
    motion: 'Alarm Siren',
    aux: 'Aux LED',
  }
  return m[key] ?? key
}
</script>

<template>
  <section class="page-frame">
    <BaseSearchFilterCard
      v-model:search="searchDraft"
      v-model:active-filter="activeDeviceFilter"
      v-model:active-secondary-filter="activeStatusFilter"
      v-model:start="start"
      v-model:end="end"
      :filters="deviceFilters"
      :secondary-filters="statusFilters"
      secondary-label="Status"
      @apply-search="applySearch"
    >
      <template #actions>
        <BaseRefreshButton variant="icon" :loading="loading" @click="load" />
      </template>
    </BaseSearchFilterCard>

    <BasePaginatedTable :columns="columns" :rows="rows" :page="page" :total="total" :limit="limit" :loading="loading"
      empty-title="No device actions" :empty-hint="tableEmptyHint" @update:page="page = $event"
      @update:limit="limit = $event">
      <template #cell-id="{ value }">
        <span class="mono cell-id">#{{ value }}</span>
      </template>
      <template #cell-device="{ value }">
        <div class="device-cell">
          <span class="device-cell__icon" :class="`device-cell__icon--${value}`">
            <svg v-if="value === 'fan' || value === 'quat' || value === 'temperature'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2.1 2.1M17.4 17.4l2.1 2.1M19.5 4.5l-2.1 2.1M6.6 17.4l-2.1 2.1" stroke-linecap="round" />
            </svg>
            <svg v-else-if="value === 'dehumidifier' || value === 'may_hut_am' || value === 'humidity'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2">
              <path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="value === 'living_room_light' || value === 'aux_led' || value === 'den_phong_khach' || value === 'den_led_phu' || value === 'light' || value === 'aux'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"
                stroke-linecap="round" />
            </svg>
            <svg v-else-if="value === 'alarm_siren' || value === 'bao_dong' || value === 'motion'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3a4 4 0 0 1 4 4v7H8V7a4 4 0 0 1 4-4Z" stroke-linejoin="round" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          </span>
          <span class="device-cell__label">{{ deviceLabel(String(value)) }}</span>
        </div>
      </template>
      <template #cell-action="{ row }">
        <span class="cmd-badge" :class="`cmd-badge--${row.actionKind}`">
          <span v-if="row.actionKind === 'on'" class="cmd-badge__dot" aria-hidden="true" />
          <span v-if="row.actionKind === 'off'" class="cmd-badge__dot cmd-badge__dot--off" aria-hidden="true" />
          <span v-if="row.actionKind === 'noreply'" class="cmd-badge__icon-warn" aria-hidden="true">!</span>
          {{ row.action }}
        </span>
      </template>
    </BasePaginatedTable>
  </section>
</template>

<style scoped>
.page-frame {
  overflow: hidden;
}

.mono {
  font-variant-numeric: tabular-nums;
}

.cell-id {
  font-weight: 700;
  color: #475569;
}

.device-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-cell__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.device-cell__icon svg {
  width: 22px;
  height: 22px;
}

.device-cell__icon--fan {
  background: linear-gradient(145deg, #fee2e2, #fecaca);
  color: #dc2626;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.12);
}

.device-cell__icon--dehumidifier {
  background: linear-gradient(145deg, #dbeafe, #bfdbfe);
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
}

.device-cell__icon--living_room_light {
  background: linear-gradient(145deg, #fef3c7, #fde68a);
  color: #d97706;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.12);
}

.device-cell__icon--aux_led {
  background: linear-gradient(145deg, #cffafe, #a5f3fc);
  color: #0284c7;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.12);
}

.device-cell__icon--alarm_siren {
  background: linear-gradient(145deg, #ede9fe, #ddd6fe);
  color: #7c3aed;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.12);
}

.device-cell__label {
  font-weight: 600;
  color: #0f172a;
}

.cmd-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.03em;
  border: 1px solid transparent;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.cmd-badge:hover {
  transform: translateY(-1px);
}

.cmd-badge__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.25);
  animation: pulse-dot 2s ease-in-out infinite;
}

.cmd-badge__dot--off {
  background: #64748b;
  box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.2);
  animation: none;
}

.cmd-badge__icon-warn {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 900;
  background: rgba(255, 255, 255, 0.95);
  color: #c2410c;
}

@keyframes pulse-dot {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.25);
  }

  50% {
    box-shadow: 0 0 0 6px rgba(22, 163, 74, 0.12);
  }
}

.cmd-badge--on {
  color: #14532d;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-color: #86efac;
}

.cmd-badge--off {
  color: #1e293b;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #cbd5e1;
}

.cmd-badge--noreply {
  color: #9a3412;
  background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
  border-color: #fdba74;
}

.cmd-badge--other {
  color: #334155;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-color: #e2e8f0;
}
</style>
