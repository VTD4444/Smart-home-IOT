<script setup lang="ts">
import { computed } from 'vue'

export type TableColumn = { key: string; label: string }

const props = withDefaults(
  defineProps<{
    columns: TableColumn[]
    rows: Record<string, unknown>[]
    page: number
    total: number
    limit: number
    loading?: boolean
    limitOptions?: number[]
    /** Khi không có dòng (và không loading) */
    emptyTitle?: string
    emptyHint?: string
  }>(),
  {
    loading: false,
    limitOptions: () => [10, 25, 50],
    emptyTitle: 'No data',
    emptyHint: '',
  },
)

const emit = defineEmits<{
  'update:page': [value: number]
  'update:limit': [value: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.limit)))

function buildPageItems(current: number, total: number, delta = 2): (number | 'gap')[] {
  if (total <= 1) return [1]
  const range: number[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    }
  }
  const out: (number | 'gap')[] = []
  let prev: number | undefined
  for (const i of range) {
    if (prev !== undefined) {
      if (i - prev === 2) out.push(prev + 1)
      else if (i - prev > 1) out.push('gap')
    }
    out.push(i)
    prev = i
  }
  return out
}

const pageItems = computed(() => buildPageItems(props.page, totalPages.value))

function goPage(n: number) {
  const clamped = Math.min(Math.max(1, n), totalPages.value)
  if (clamped !== props.page) emit('update:page', clamped)
}

function onLimitInput(e: Event) {
  const v = Number((e.target as HTMLSelectElement).value)
  emit('update:limit', v)
  emit('update:page', 1)
}
</script>

<template>
  <section class="table-card">
    <div class="table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody :class="{ 'tbody--dim': loading }">
          <template v-if="!loading && rows.length === 0">
            <tr class="empty-row">
              <td class="table-empty" :colspan="columns.length">
                <div class="table-empty__inner">
                  <span class="table-empty__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                      <rect x="4" y="5" width="16" height="14" rx="2" />
                      <path d="M8 3v4M16 3v4M4 11h16" stroke-linecap="round" />
                      <path d="M9 15h6" stroke-linecap="round" />
                    </svg>
                  </span>
                  <p class="table-empty__title">{{ emptyTitle }}</p>
                  <p v-if="emptyHint" class="table-empty__hint">{{ emptyHint }}</p>
                </div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="row in rows" :key="String(row.id)" class="data-row">
              <td v-for="col in columns" :key="col.key">
                <slot :name="`cell-${col.key}`" :row="row" :col="col" :value="row[col.key]">
                  <span v-if="col.key === 'status'" class="status" :class="`status-${String(row[col.key]).toLowerCase()}`">
                    {{ row[col.key] }}
                  </span>
                  <span v-else>{{ row[col.key] }}</span>
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-if="loading" class="loading-shade" aria-hidden="true" />
    </div>

    <footer class="pager">
      <div class="pager-left">
        <label class="limit-label">
          <span class="limit-label__text">Rows per page</span>
          <select class="limit-select" :value="limit" @change="onLimitInput">
            <option v-for="opt in limitOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
      </div>
      <div class="pager-right">
        <button
          type="button"
          class="nav-btn"
          :disabled="page <= 1"
          aria-label="Previous page"
          @click="goPage(page - 1)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          <span>Previous</span>
        </button>
        <div class="page-nums" role="navigation" aria-label="Pagination">
          <template v-for="(item, idx) in pageItems" :key="`${item}-${idx}`">
            <span v-if="item === 'gap'" class="page-gap">…</span>
            <button
              v-else
              type="button"
              class="page-btn"
              :class="{ 'page-btn--active': item === page }"
              @click="goPage(item)"
            >
              {{ item }}
            </button>
          </template>
        </div>
        <button
          type="button"
          class="nav-btn"
          :disabled="page >= totalPages"
          aria-label="Next page"
          @click="goPage(page + 1)"
        >
          <span>Next</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.table-card {
  flex: 1;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 18px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}
.table-scroll {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

@media (max-width: 768px) {
  .table-card {
    height: auto;
    min-height: 300px;
  }
}
.loading-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(248, 250, 252, 0.75) 100%);
  pointer-events: none;
  animation: shade-pulse 1.1s ease-in-out infinite alternate;
}
@keyframes shade-pulse {
  from {
    opacity: 0.65;
  }
  to {
    opacity: 1;
  }
}
.table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
}
thead tr {
  background: #cbd5e1;
}
th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #cbd5e1;
  text-align: left;
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #1e293b;
  border-bottom: 1px solid #64748b;
  box-shadow: inset 0 -1px 0 #64748b;
}
tbody td {
  border-bottom: 1px solid #e8ecf2;
  text-align: left;
  padding: 10px 12px;
  font-size: 14px;
  color: #0f172a;
  vertical-align: middle;
  transition: background 0.2s ease;
}
.data-row:hover td {
  background: rgba(59, 130, 246, 0.05);
}
.tbody--dim {
  opacity: 0.72;
}

.table-empty {
  padding: 28px 20px !important;
  text-align: center;
  vertical-align: middle;
  border-bottom: none !important;
  background: linear-gradient(180deg, #fafbfc 0%, #f8fafc 100%);
}
.table-empty__inner {
  max-width: 360px;
  margin: 0 auto;
}
.table-empty__icon {
  display: inline-flex;
  padding: 16px;
  border-radius: 16px;
  background: #e2e8f0;
  color: #64748b;
  margin-bottom: 16px;
}
.table-empty__icon svg {
  width: 40px;
  height: 40px;
}
.table-empty__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}
.table-empty__hint {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #64748b;
}

.pager {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: #cbd5e1;
  border-top: 1px solid #94a3b8;
}
.pager-left {
  display: flex;
  align-items: center;
}
.limit-label {
  display: flex;
  align-items: center;
  gap: 10px;
}
.limit-label__text {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.limit-select {
  height: 36px;
  padding: 0 32px 0 12px;
  border-radius: 10px;
  border: 1px solid #64748b;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}
.pager-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #64748b;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease;
}
.nav-btn svg {
  width: 18px;
  height: 18px;
}
.nav-btn:hover:not(:disabled) {
  background: #fff;
  transform: translateY(-1px);
}
.nav-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.page-nums {
  display: flex;
  align-items: center;
  gap: 4px;
}
.page-gap {
  padding: 0 6px;
  font-weight: 700;
  color: #475569;
}
.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;
}
.page-btn:hover:not(.page-btn--active) {
  background: rgba(255, 255, 255, 0.55);
  border-color: #64748b;
}
.page-btn--active {
  color: #fff;
  border-color: #1d4ed8;
  background: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
}
.page-btn--active:hover {
  transform: translateY(-1px);
}

.status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
}
.status-active {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}
.status-inactive {
  background: #f9fafb;
  color: #4b5563;
  border-color: #e5e7eb;
}
.status-loading {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}
.status-error,
.status-timeout {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}
</style>
