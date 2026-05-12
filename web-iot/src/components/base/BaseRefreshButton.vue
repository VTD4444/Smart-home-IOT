<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{ loading?: boolean; variant?: 'default' | 'icon' }>(), {
  variant: 'default',
})
const emit = defineEmits<{ click: [] }>()

const spin = ref(false)

watch(
  () => props.loading,
  (v) => {
    if (v) spin.value = true
    else {
      window.setTimeout(() => {
        spin.value = false
      }, 450)
    }
  },
)

function onClick() {
  spin.value = true
  emit('click')
}
</script>

<template>
  <button
    type="button"
    class="refresh-btn"
    :class="{ 'refresh-btn--icon': variant === 'icon' }"
    :disabled="loading"
    :title="variant === 'icon' ? (loading ? 'Refreshing…' : 'Refresh') : undefined"
    :aria-label="variant === 'icon' ? (loading ? 'Refreshing' : 'Refresh') : undefined"
    @click="onClick"
  >
    <span class="refresh-btn__icon" :class="{ 'refresh-btn__icon--spin': spin || loading }" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <path
          d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M21 21v-5h-5"
        />
      </svg>
    </span>
    <span v-if="variant !== 'icon'" class="refresh-btn__text">{{ loading ? 'Refreshing…' : 'Refresh' }}</span>
  </button>
</template>

<style scoped>
.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: none;
  cursor: pointer;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 55%, #2563eb 100%);
  box-shadow:
    0 4px 14px rgba(37, 99, 235, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition:
    transform 0.2s ease,
    box-shadow 0.25s ease,
    filter 0.2s ease;
}
.refresh-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 8px 22px rgba(37, 99, 235, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  filter: brightness(1.05);
}
.refresh-btn:active:not(:disabled) {
  transform: translateY(0);
}
.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.82;
  filter: grayscale(0.08);
}
.refresh-btn__icon {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
}
.refresh-btn__icon svg {
  width: 20px;
  height: 20px;
}
.refresh-btn__icon--spin {
  animation: spin-refresh 0.75s linear infinite;
}
@keyframes spin-refresh {
  to {
    transform: rotate(360deg);
  }
}
.refresh-btn__text {
  letter-spacing: 0.02em;
}

.refresh-btn--icon {
  padding: 0;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  justify-content: center;
  gap: 0;
}
.refresh-btn--icon .refresh-btn__icon {
  width: 20px;
  height: 20px;
}
.refresh-btn--icon .refresh-btn__icon svg {
  width: 18px;
  height: 18px;
}
</style>
