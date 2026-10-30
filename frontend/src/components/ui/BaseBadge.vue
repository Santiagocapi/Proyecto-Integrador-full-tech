<script setup>
defineProps({
  // Ej.: "cyan" para Nuevo, "magenta" para Oferta, "violet" para Kit
  variant: {
    type: String,
    default: 'cyan',
    validator: (value) =>
      ['cyan', 'magenta', 'violet', 'success', 'warning', 'error', 'neutral'].includes(value),
  },
})
</script>

<template>
  <span class="base-badge" :class="`base-badge--${variant}`">
    <slot />
  </span>
</template>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border: 1px solid currentColor;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.base-badge--cyan {
  color: var(--color-cyan);
  box-shadow: 0 0 6px rgba(0, 240, 255, 0.4);
}

.base-badge--magenta {
  color: var(--color-magenta);
  box-shadow: 0 0 6px rgba(255, 0, 122, 0.4);
}

.base-badge--violet {
  color: var(--color-violet);
  box-shadow: 0 0 6px rgba(138, 43, 226, 0.4);
}

.base-badge--success {
  color: var(--color-success);
}

.base-badge--warning {
  color: var(--color-warning);
}

.base-badge--error {
  color: var(--color-error);
}

.base-badge--neutral {
  color: var(--color-text-muted);
}
</style>
