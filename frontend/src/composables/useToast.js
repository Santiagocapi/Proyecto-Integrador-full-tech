import { ref } from 'vue'

const toasts = ref([])
let nextId = 0
const timers = new Map()

export function useToast() {
  const showToast = (message, type = 'success', duration = 3000) => {
    const id = ++nextId
    toasts.value.push({ id, message, type })

    timers.set(
      id,
      setTimeout(() => {
        removeToast(id)
      }, duration),
    )
  }

  const removeToast = (id) => {
    clearTimeout(timers.get(id))
    timers.delete(id)
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    showToast,
    removeToast,
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    info: (msg) => showToast(msg, 'info'),
  }
}
