<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  accent: string
  accentSoft: string
  borderColor: string
  disabled?: boolean
  /** Đang chờ phần cứng phản hồi — hiệu ứng loading */
  loading?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function toggle() {
  if (props.disabled || props.loading) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button type="button" class="toggle" :class="{
    'toggle--on': modelValue,
    'toggle--disabled': disabled && !loading,
    'toggle--loading': loading,
  }" :style="{
    '--toggle-accent': accent,
    '--toggle-soft': accentSoft,
    '--toggle-border': borderColor,
  }" role="switch" :aria-checked="modelValue" :aria-busy="loading" @click="toggle">
    <span class="toggle__track">
      <span class="toggle__shimmer" v-if="loading" aria-hidden="true" />
      <span class="toggle__thumb">
        <span v-if="loading" class="toggle__spinner" aria-hidden="true" />
      </span>
    </span>
  </button>
</template>

<style scoped>
.toggle {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.toggle--disabled {
  cursor: not-allowed;
}

.toggle--loading {
  cursor: wait;
}

.toggle__track {
  display: block;
  width: 52px;
  height: 28px;
  border-radius: 999px;
  background: linear-gradient(180deg, #e5e7eb 0%, #cbd5e1 100%);
  border: 2px solid #94a3b8;
  box-shadow:
    0 2px 8px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  position: relative;
  overflow: hidden;
  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.toggle--on .toggle__track {
  background: linear-gradient(135deg,
      color-mix(in srgb, var(--toggle-accent) 78%, #ffffff 22%) 0%,
      color-mix(in srgb, var(--toggle-accent) 92%, #ffffff 8%) 55%,
      var(--toggle-accent) 100%);
  border-color: var(--toggle-accent);
  box-shadow:
    0 6px 16px color-mix(in srgb, var(--toggle-accent) 38%, transparent 62%),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.toggle--disabled .toggle__track {
  background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #cbd5e1;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.toggle--disabled.toggle--on .toggle__track {
  background: linear-gradient(135deg, color-mix(in srgb, var(--toggle-soft) 75%, #ffffff 25%) 0%, var(--toggle-soft) 100%);
  border-color: color-mix(in srgb, var(--toggle-accent) 40%, #94a3b8 60%);
}

.toggle--loading .toggle__track {
  border-color: var(--toggle-accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.toggle__shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg,
      transparent 0%,
      rgba(255, 255, 255, 0.55) 45%,
      transparent 90%);
  animation: shimmer 1.25s ease-in-out infinite;
}

@keyframes shimmer {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}

.toggle__thumb {
  position: absolute;
  top: 3px;
  left: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  display: grid;
  place-items: center;
  transition:
    transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.25s ease;
}

.toggle--on .toggle__thumb {
  transform: translateX(22px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.toggle:active:not(.toggle--disabled):not(.toggle--loading) .toggle__thumb {
  transform: scale(0.96) translateX(0);
}

.toggle--on:active:not(.toggle--disabled):not(.toggle--loading) .toggle__thumb {
  transform: scale(0.96) translateX(22px);
}

.toggle__spinner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(59, 130, 246, 0.25);
  border-top-color: var(--toggle-accent);
  animation: spin 0.65s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
