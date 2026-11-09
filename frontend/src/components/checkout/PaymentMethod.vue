<script setup>
// v-model: 'mercadopago' | 'transferencia' | 'efectivo'
const model = defineModel({
  type: String,
  default: 'mercadopago',
  validator: (value) => ['mercadopago', 'transferencia', 'efectivo'].includes(value),
})

const options = [
  {
    value: 'mercadopago',
    label: 'Mercado Pago',
    description: 'Tarjeta de crédito, débito o dinero en cuenta.',
    notice:
      'Te vamos a redirigir a Mercado Pago para completar el pago. Modo de prueba (sandbox): no se realizan cobros reales.',
  },
  {
    value: 'transferencia',
    label: 'Transferencia bancaria',
    description: 'Te enviamos los datos bancarios para transferir.',
    notice:
      'Coordinamos el pago después de confirmar. El pedido queda pendiente hasta que se acredite.',
  },
  {
    value: 'efectivo',
    label: 'Efectivo al retirar',
    description: 'Pagás en efectivo cuando retirás el pedido.',
    notice:
      'Coordinamos el pago después de confirmar. El pedido queda pendiente hasta que se confirme el pago.',
  },
]
</script>

<template>
  <fieldset class="payment-method">
    <legend class="payment-method__legend">Método de pago</legend>

    <label
      v-for="option in options"
      :key="option.value"
      class="payment-method__option"
      :class="{ 'payment-method__option--selected': model === option.value }"
    >
      <input
        v-model="model"
        class="payment-method__radio"
        type="radio"
        name="payment-method"
        :value="option.value"
      />
      <span class="payment-method__content">
        <span class="payment-method__label">{{ option.label }}</span>
        <span class="payment-method__description">{{ option.description }}</span>
        <span v-if="model === option.value" class="payment-method__notice">
          {{ option.notice }}
        </span>
      </span>
    </label>
  </fieldset>
</template>

<style scoped>
.payment-method {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  border: none;
}

.payment-method__legend {
  margin-bottom: var(--space-4);
  font-family: var(--font-display);
  font-size: var(--text-xl);
}

.payment-method__option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.payment-method__option:hover {
  border-color: var(--color-text-muted);
}

.payment-method__option--selected {
  border-color: var(--color-cyan);
  box-shadow: var(--glow-cyan);
}

.payment-method__option:focus-within {
  outline: 2px solid var(--color-cyan);
  outline-offset: 2px;
}

.payment-method__radio {
  flex: none;
  width: 1.125rem;
  height: 1.125rem;
  margin-top: 2px;
  accent-color: var(--color-cyan);
}

.payment-method__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.payment-method__label {
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.payment-method__description {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.payment-method__notice {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-warning);
}
</style>
