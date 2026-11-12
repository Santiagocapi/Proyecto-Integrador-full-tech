<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'
import { formatPrice } from '@/utils/format'

// items: ítems del carrito { variantId, name, variantName, price, quantity }
defineProps({
  items: { type: Array, required: true },
  subtotal: { type: Number, required: true },
  loading: { type: Boolean, default: false },
})

defineEmits(['confirm'])
</script>

<template>
  <aside class="order-summary" aria-labelledby="order-summary-title">
    <h2 id="order-summary-title" class="order-summary__title">Resumen del pedido</h2>

    <ul class="order-summary__items">
      <li v-for="item in items" :key="item.variantId" class="order-summary__item">
        <div class="order-summary__item-info">
          <span class="order-summary__item-name">{{ item.name }}</span>
          <span v-if="item.variantName && item.variantName !== 'Único'" class="order-summary__item-variant">
            {{ item.variantName }}
          </span>
          <span class="order-summary__item-qty">Cantidad: {{ item.quantity }}</span>
        </div>
        <span class="order-summary__item-total">{{ formatPrice(item.price * item.quantity) }}</span>
      </li>
    </ul>

    <dl class="order-summary__totals">
      <div class="order-summary__row">
        <dt>Subtotal</dt>
        <dd>{{ formatPrice(subtotal) }}</dd>
      </div>
      <div class="order-summary__row">
        <dt>Envío</dt>
        <dd class="order-summary__free">Gratis</dd>
      </div>
      <div class="order-summary__row order-summary__row--total">
        <dt>Total</dt>
        <dd>{{ formatPrice(subtotal) }}</dd>
      </div>
    </dl>

    <BaseButton size="lg" block :loading="loading" @click="$emit('confirm')">
      {{ loading ? 'Procesando...' : 'Confirmar pedido' }}
    </BaseButton>
  </aside>
</template>

<style scoped>
.order-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
}

.order-summary__title {
  font-size: var(--text-xl);
}

.order-summary__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.order-summary__item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.order-summary__item-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.order-summary__item-name {
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.order-summary__item-variant {
  font-size: var(--text-sm);
  color: var(--color-violet-text);
}

.order-summary__item-qty {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.order-summary__item-total {
  flex: none;
  font-weight: var(--font-semibold);
}

.order-summary__totals {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
}

.order-summary__row {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-muted);
}

.order-summary__row dd {
  margin: 0;
}

.order-summary__free {
  color: var(--color-success);
}

.order-summary__row--total {
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-text);
}

.order-summary__row--total dd {
  color: var(--color-cyan);
  text-shadow: var(--text-glow-cyan);
}
</style>
