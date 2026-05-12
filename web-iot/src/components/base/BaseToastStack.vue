<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
const { items } = storeToRefs(toast)
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack" aria-live="polite" aria-relevant="additions removals">
      <TransitionGroup name="toast" tag="div" class="toast-stack__inner">
        <article
          v-for="t in items"
          :key="t.id"
          class="toast"
          :class="`toast--${t.type}`"
          role="status"
        >
          <span class="toast__icon" aria-hidden="true">
            <svg v-if="t.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="t.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="12" r="9" />
              <path d="M15 9l-6 6M9 9l6 6" stroke-linecap="round" />
            </svg>
            <svg v-else-if="t.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 9v4M12 17h.01M10.3 4h3.4l7.3 14H3l7.3-14Z" stroke-linejoin="round" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 10v6M12 8h.01" stroke-linecap="round" />
            </svg>
          </span>
          <div class="toast__body">
            <p v-if="t.title" class="toast__title">{{ t.title }}</p>
            <p class="toast__msg">{{ t.message }}</p>
          </div>
          <button type="button" class="toast__close" aria-label="Dismiss" @click="toast.dismiss(t.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
            </svg>
          </button>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: min(400px, calc(100vw - 32px));
  pointer-events: none;
}
.toast-stack__inner {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toast-stack :deep(.toast) {
  pointer-events: auto;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff;
  box-shadow:
    0 12px 40px rgba(15, 23, 42, 0.12),
    0 0 0 1px rgba(15, 23, 42, 0.06);
  border-left: 4px solid #64748b;
}
.toast--success {
  border-left-color: #16a34a;
}
.toast--error {
  border-left-color: #dc2626;
}
.toast--warning {
  border-left-color: #ea580c;
}
.toast--info {
  border-left-color: #2563eb;
}

.toast__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
}
.toast--success .toast__icon {
  background: #dcfce7;
  color: #15803d;
}
.toast--error .toast__icon {
  background: #fee2e2;
  color: #b91c1c;
}
.toast--warning .toast__icon {
  background: #ffedd5;
  color: #c2410c;
}
.toast--info .toast__icon {
  background: #dbeafe;
  color: #1d4ed8;
}
.toast__icon svg {
  width: 20px;
  height: 20px;
}

.toast__body {
  min-width: 0;
  flex: 1;
  padding-top: 2px;
}
.toast__title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
}
.toast__msg {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: #475569;
}

.toast__close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}
.toast__close:hover {
  background: #f1f5f9;
  color: #334155;
}
.toast__close svg {
  width: 16px;
  height: 16px;
}

.toast-enter-active {
  animation: toast-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.toast-leave-active {
  animation: toast-out 0.32s ease forwards;
}
.toast-move {
  transition: transform 0.35s ease;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(110%) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
@keyframes toast-out {
  to {
    opacity: 0;
    transform: translateX(20px) scale(0.96);
  }
}
</style>
