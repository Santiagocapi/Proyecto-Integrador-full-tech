<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  // primary: acción principal (cyan) · secondary: borde magenta · ghost: solo texto · danger: borrar
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'ghost', 'danger'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  // Si se pasa "to", el botón navega como un link (ej. to="/catalogo")
  to: { type: [String, Object], default: null },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
})

const isLink = computed(() => props.to !== null)
const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <component
    :is="isLink ? RouterLink : 'button'"
    :to="isLink ? to : undefined"
    :type="isLink ? undefined : type"
    :disabled="isLink ? undefined : isDisabled"
    :aria-disabled="isDisabled || undefined"
    :aria-busy="loading || undefined"
    class="base-button"
    :class="[`base-button--${variant}`, `base-button--${size}`, { 'base-button--block': block }]"
  >
    <span v-if="loading" class="base-button__spinner" aria-hidden="true"></span>
    <slot />
  </component>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-weight: var(--font-semibold);
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  transition:
    box-shadow var(--transition-fast),
    background-color var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast);
}

.base-button:hover {
  text-decoration: none;
}

.base-button:active:not([aria-disabled='true']) {
  transform: scale(0.97);
}

/* Tamaños */
.base-button--sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
}

.base-button--md {
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-base);
}

.base-button--lg {
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-lg);
}

.base-button--block {
  display: flex;
  width: 100%;
}

/* Variantes */
.base-button--primary {
  background-color: var(--color-cyan);
  color: var(--color-text-on-accent);
}

.base-button--primary:hover,
.base-button--primary:focus-visible {
  box-shadow: var(--glow-cyan);
}

.base-button--secondary {
  background-color: transparent;
  border-color: var(--color-magenta);
  color: var(--color-magenta);
}

.base-button--secondary:hover,
.base-button--secondary:focus-visible {
  background-color: var(--color-magenta);
  color: var(--color-text);
  box-shadow: var(--glow-magenta);
}

.base-button--ghost {
  background-color: transparent;
  color: var(--color-cyan);
}

.base-button--ghost:hover,
.base-button--ghost:focus-visible {
  background-color: var(--color-surface-2);
}

.base-button--danger {
  background-color: var(--color-error);
  color: var(--color-text);
}

.base-button--danger:hover,
.base-button--danger:focus-visible {
  box-shadow: 0 0 12px var(--color-error);
}

/* Deshabilitado o cargando */
.base-button[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  pointer-events: none;
}

.base-button__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--radius-full);
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
