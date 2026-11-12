<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="toast-container" aria-live="polite" aria-atomic="false">
    <transition-group name="toast" tag="div" class="toast-list">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-message"
        :class="`toast-message--${toast.type}`"
        :role="toast.type === 'error' ? 'alert' : 'status'"
      >
        <span>{{ toast.message }}</span>
        <button
          @click="removeToast(toast.id)"
          type="button"
          aria-label="Cerrar notificación"
          class="toast-close"
        >
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: var(--z-toast, 1000);
  width: min(360px, calc(100vw - 2 * var(--space-4)));
  pointer-events: none;
}
.toast-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.toast-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-cyan);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  pointer-events: auto;
}
.toast-message--error {
  border-color: var(--color-error);
}
.toast-message--success {
  border-color: var(--color-success);
}
.toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: var(--text-xl);
  min-width: 32px;
  min-height: 32px;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
