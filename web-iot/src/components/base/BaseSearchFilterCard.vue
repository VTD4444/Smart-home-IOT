<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

export type FilterChip = { key: string; label: string; icon?: FilterIcon }
export type FilterIcon =
  | 'all'
  | 'temperature'
  | 'humidity'
  | 'light'
  | 'motion'
  | 'active'
  | 'inactive'
  | 'timeout'

withDefaults(
  defineProps<{
    search: string
    filters: FilterChip[]
    activeFilter: string
    secondaryFilters?: FilterChip[]
    activeSecondaryFilter?: string
    secondaryLabel?: string
    start?: string
    end?: string
    /** Nhãn nhóm chip đầu (vd. Sensor trên trang Sensors) */
    primaryFiltersLabel?: string
  }>(),
  { primaryFiltersLabel: 'Device' },
)

const emit = defineEmits<{
  'update:search': [value: string]
  'update:activeFilter': [value: string]
  'update:activeSecondaryFilter': [value: string]
  'update:start': [value: string]
  'update:end': [value: string]
  'apply-search': []
}>()

const rootRef = ref<HTMLElement | null>(null)
const advancedOpen = ref(false)

function toggleAdvanced() {
  advancedOpen.value = !advancedOpen.value
}

function applyAdvanced() {
  emit('apply-search')
  advancedOpen.value = false
}

function onDocPointerDown(e: PointerEvent) {
  const el = rootRef.value
  if (!el || !advancedOpen.value) return
  const t = e.target
  if (t instanceof Node && !el.contains(t)) {
    advancedOpen.value = false
  }
}

onMounted(() => document.addEventListener('pointerdown', onDocPointerDown, true))
onUnmounted(() => document.removeEventListener('pointerdown', onDocPointerDown, true))
</script>

<template>
  <section ref="rootRef" class="panel">
    <div class="search-row">
      <div class="search-wrap">
        <span class="search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </span>
        <input class="search-input" :value="search" type="search"
          placeholder="Tìm theo giá trị, ID (#1024), thời gian… — Enter" autocomplete="off"
          @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
          @keydown.enter.prevent="$emit('apply-search')" />
      </div>
      <button type="button" class="advanced-btn" :class="{ 'advanced-btn--open': advancedOpen }"
        :aria-expanded="advancedOpen" aria-controls="search-advanced-panel" id="search-advanced-trigger"
        @click.stop="toggleAdvanced">
        <span>Advanced search</span>
        <span class="advanced-btn__chev" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      <div v-if="$slots.actions" class="search-extra-actions">
        <slot name="actions" />
      </div>
    </div>

    <div v-show="advancedOpen" id="search-advanced-panel" class="advanced-panel" role="region"
      aria-labelledby="search-advanced-trigger" @click.stop>
      <div class="dates">
        <label class="date-field">
          <span class="date-label">Start time</span>
          <div class="date-input-shell">
            <input class="date-native" :value="start ?? ''" type="datetime-local" step="1"
              @input="$emit('update:start', ($event.target as HTMLInputElement).value)" />
            <span class="date-cal" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" stroke-linecap="round" />
              </svg>
            </span>
          </div>
        </label>
        <label class="date-field">
          <span class="date-label">End time</span>
          <div class="date-input-shell">
            <input class="date-native" :value="end ?? ''" type="datetime-local" step="1"
              @input="$emit('update:end', ($event.target as HTMLInputElement).value)" />
            <span class="date-cal" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" stroke-linecap="round" />
              </svg>
            </span>
          </div>
        </label>
      </div>

      <div class="chips-block">
        <p class="chips-label">{{ primaryFiltersLabel }}</p>
        <div class="chips" role="group" :aria-label="`${primaryFiltersLabel} filter`">
          <button v-for="item in filters" :key="item.key || 'all'" type="button" class="chip"
            :class="{ 'chip--active': item.key === activeFilter }" @click="$emit('update:activeFilter', item.key)">
            <span v-if="item.icon" class="chip-icon" :class="`chip-icon--${item.icon}`">
              <svg v-if="item.icon === 'all'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="4" width="7" height="7" rx="1.5" />
                <rect x="13" y="4" width="7" height="7" rx="1.5" />
                <rect x="4" y="13" width="7" height="7" rx="1.5" />
                <rect x="13" y="13" width="7" height="7" rx="1.5" />
              </svg>
              <svg v-else-if="item.icon === 'temperature'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <path d="M12 2v13.5a4 4 0 1 0 4-4V7" stroke-linecap="round" />
                <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
              </svg>
              <svg v-else-if="item.icon === 'humidity'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z" stroke-linejoin="round" />
              </svg>
              <svg v-else-if="item.icon === 'light'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <circle cx="12" cy="12" r="4" />
                <path
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                  stroke-linecap="round" />
              </svg>
              <svg v-else-if="item.icon === 'motion'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <path d="M12 3a4 4 0 0 1 4 4v7H8V7a4 4 0 0 1 4-4Z" stroke-linejoin="round" />
                <path d="M8 21h8" stroke-linecap="round" />
              </svg>
              <svg v-else-if="item.icon === 'active'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <circle cx="12" cy="12" r="8" />
                <path d="M8.5 12.5l2.3 2.3L15.8 10" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else-if="item.icon === 'inactive'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <circle cx="12" cy="12" r="8" />
                <path d="M9 12h6" stroke-linecap="round" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="chip-text">{{ item.label }}</span>
          </button>
        </div>
      </div>

      <div v-if="secondaryFilters?.length" class="chips-block">
        <p class="chips-label">{{ secondaryLabel || 'Status' }}</p>
        <div class="chips" role="group" aria-label="Filter by status">
          <button v-for="item in secondaryFilters" :key="`secondary-${item.key || 'all'}`" type="button" class="chip"
            :class="{ 'chip--active': item.key === (activeSecondaryFilter ?? '') }"
            @click="$emit('update:activeSecondaryFilter', item.key)">
            <span v-if="item.icon" class="chip-icon" :class="`chip-icon--${item.icon}`">
              <svg v-if="item.icon === 'all'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="4" width="7" height="7" rx="1.5" />
                <rect x="13" y="4" width="7" height="7" rx="1.5" />
                <rect x="4" y="13" width="7" height="7" rx="1.5" />
                <rect x="13" y="13" width="7" height="7" rx="1.5" />
              </svg>
              <svg v-else-if="item.icon === 'active'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <circle cx="12" cy="12" r="8" />
                <path d="M8.5 12.5l2.3 2.3L15.8 10" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else-if="item.icon === 'inactive'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <circle cx="12" cy="12" r="8" />
                <path d="M9 12h6" stroke-linecap="round" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="chip-text">{{ item.label }}</span>
          </button>
        </div>
      </div>

      <div class="advanced-actions">
        <button type="button" class="apply-btn" @click="applyAdvanced">Áp dụng</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  position: relative;
  flex-shrink: 0;
  padding: 12px 14px 12px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e8ecf2;
  box-shadow:
    0 2px 16px rgba(15, 23, 42, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
}

.search-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.advanced-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 0 12px 0 14px;
  height: 40px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #1e40af;
  cursor: pointer;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  white-space: nowrap;
}

.advanced-btn:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.advanced-btn--open {
  background: #dbeafe;
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.advanced-btn__chev {
  display: grid;
  place-items: center;
  transition: transform 0.2s ease;
}

.advanced-btn__chev svg {
  width: 18px;
  height: 18px;
}

.advanced-btn--open .advanced-btn__chev {
  transform: rotate(180deg);
}

.search-extra-actions {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.advanced-panel {
  position: absolute;
  z-index: 40;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  padding: 14px 14px 12px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 12px 40px rgba(15, 23, 42, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset;
  max-height: min(70vh, 520px);
  overflow-y: auto;
}

.search-icon {
  position: absolute;
  left: 12px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  color: #94a3b8;
  pointer-events: none;
}

.search-icon svg {
  width: 18px;
  height: 18px;
}

.search-input {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 0 12px 0 40px;
  font-size: 13px;
  color: #0f172a;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.search-input::placeholder {
  color: #94a3b8;
  font-size: 12px;
}

.search-input:hover {
  border-color: #cbd5e1;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.dates {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.date-input-shell {
  position: relative;
  display: flex;
  align-items: center;
}

.date-native {
  width: 100%;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 0 40px 0 10px;
  font-size: 12px;
  color: #334155;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.date-native:hover {
  border-color: #cbd5e1;
}

.date-native:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.date-cal {
  position: absolute;
  right: 10px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  color: #64748b;
  pointer-events: none;
}

.date-cal svg {
  width: 18px;
  height: 18px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chips-block .chips {
  margin-top: 0;
}

.chips-block+.chips-block {
  margin-top: 10px;
}

.chips-label {
  margin: 12px 0 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.chips-block:first-of-type .chips-label {
  margin-top: 4px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 999px;
  padding: 6px 12px 6px 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  transition:
    transform 0.18s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.chip:hover {
  transform: translateY(-1px);
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.chip--active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}

.chip--active:hover {
  border-color: transparent;
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4);
}

.chip-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  flex-shrink: 0;
}

.chip-icon svg {
  width: 14px;
  height: 14px;
}

.chip--active .chip-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.chip-icon--all {
  background: #e0e7ff;
  color: #4f46e5;
}

.chip-icon--temperature {
  background: #fee2e2;
  color: #dc2626;
}

.chip-icon--humidity {
  background: #dbeafe;
  color: #2563eb;
}

.chip-icon--light {
  background: #fef3c7;
  color: #d97706;
}

.chip-icon--motion {
  background: #ede9fe;
  color: #7c3aed;
}

.chip-icon--active {
  background: #dcfce7;
  color: #15803d;
}

.chip-icon--inactive {
  background: #e2e8f0;
  color: #475569;
}

.chip-icon--timeout {
  background: #ffedd5;
  color: #c2410c;
}

.chip--active .chip-icon--all,
.chip--active .chip-icon--temperature,
.chip--active .chip-icon--humidity,
.chip--active .chip-icon--light,
.chip--active .chip-icon--motion,
.chip--active .chip-icon--active,
.chip--active .chip-icon--inactive,
.chip--active .chip-icon--timeout {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.chip-text {
  white-space: nowrap;
}

.advanced-actions {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.apply-btn {
  height: 36px;
  padding: 0 18px;
  border-radius: 10px;
  border: none;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.28);
}

.apply-btn:hover {
  filter: brightness(1.05);
}
</style>
