import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export type ToastEntry = {
  id: number
  type: ToastType
  title?: string
  message: string
}

export type ToastPush = {
  type: ToastType
  title?: string
  message: string
  duration?: number
}

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastEntry[]>([])
  let seq = 0

  function push(entry: ToastPush) {
    const id = ++seq
    const duration = entry.duration ?? 4500
    items.value = [...items.value, { id, type: entry.type, title: entry.title, message: entry.message }]
    window.setTimeout(() => dismiss(id), duration)
  }

  function dismiss(id: number) {
    items.value = items.value.filter((t) => t.id !== id)
  }

  return { items, push, dismiss }
})
