<script setup>
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'

const cartStore = useCartStore()
const { count } = storeToRefs(cartStore)
</script>

<template>
  <button
    @click="cartStore.toggleCart"
    type="button"
    class="cart-button"
    aria-label="Ver carrito de compras"
  >
    <!-- Icono de Carrito SVG -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="cart-icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>

    <span class="cart-label">Carrito</span>

    <!-- Badge con la cantidad de productos -->
    <span v-if="count > 0" :key="count" class="cart-count" aria-live="polite">
      {{ count }}
    </span>
  </button>
</template>

<style scoped>
.cart-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
}
.cart-icon {
  width: 24px;
  height: 24px;
}
.cart-count {
  position: absolute;
  top: -6px;
  right: -6px;
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  background: var(--color-cyan);
  color: var(--color-text-on-accent);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  animation: cart-pop 200ms ease-out;
}
@keyframes cart-pop {
  from {
    transform: scale(0.7);
  }
  to {
    transform: scale(1);
  }
}
@media (max-width: 480px) {
  .cart-label {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cart-count {
    animation: none;
  }
}
</style>
