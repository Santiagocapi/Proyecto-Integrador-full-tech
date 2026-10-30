<script setup>
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

// v-model: true abre el modal, false lo cierra.
// Uso: <BaseModal v-model="confirmOpen" title="¿Eliminar producto?"> ... </BaseModal>
const open = defineModel({ type: Boolean, default: false })

defineProps({
  title: { type: String, required: true },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
})

const titleId = useId()
const dialogRef = ref(null)
let lastFocused = null

function close() {
  open.value = false
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

watch(open, async (isOpen) => {
  if (isOpen) {
    // Guarda dónde estaba el foco para devolverlo al cerrar
    lastFocused = document.activeElement
    document.addEventListener('keydown', onKeydown)
    document.body.style.overflow = 'hidden'
    await nextTick()
    dialogRef.value?.focus()
  } else {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
    lastFocused?.focus?.()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="base-modal__backdrop" @click.self="close">
        <div
          ref="dialogRef"
          class="base-modal"
          :class="`base-modal--${size}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
        >
          <header class="base-modal__header">
            <h2 :id="titleId" class="base-modal__title">{{ title }}</h2>
            <button type="button" class="base-modal__close" aria-label="Cerrar" @click="close">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          <div class="base-modal__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="base-modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.base-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--space-4);
  background-color: rgba(13, 13, 17, 0.8);
  backdrop-filter: blur(4px);
}

.base-modal {
  width: 100%;
  max-height: calc(100vh - var(--space-6));
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border: 1px solid var(--color-cyan);
  border-radius: var(--radius-xl);
  box-shadow: var(--glow-cyan);
  outline: none;
}

.base-modal--sm {
  max-width: 400px;
}

.base-modal--md {
  max-width: 560px;
}

.base-modal--lg {
  max-width: 800px;
}

.base-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-5) var(--space-3);
}

.base-modal__title {
  font-size: var(--text-xl);
}

.base-modal__close {
  flex: none;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.base-modal__close:hover {
  color: var(--color-text);
  background-color: var(--color-surface-2);
}

.base-modal__body {
  padding: var(--space-2) var(--space-5) var(--space-5);
  overflow-y: auto;
  color: var(--color-text-muted);
}

.base-modal__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5) var(--space-5);
  border-top: 1px solid var(--color-border);
}

/* En celular sube desde abajo; desde tablet queda centrado */
@media (min-width: 768px) {
  .base-modal__backdrop {
    align-items: center;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-base);
}

.modal-enter-active .base-modal,
.modal-leave-active .base-modal {
  transition: transform var(--transition-base);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .base-modal,
.modal-leave-to .base-modal {
  transform: translateY(24px);
}
</style>
