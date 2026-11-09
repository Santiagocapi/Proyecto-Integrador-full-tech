<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import BaseButton from '@/components/ui/BaseButton.vue'
import { formatPrice } from '@/utils/format'

const cartStore = useCartStore()
const router = useRouter()

const goToCheckout = () => {
  cartStore.close()
  router.push('/checkout')
}

// Cerrar el drawer al presionar la tecla Escape
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && cartStore.isOpen) {
    cartStore.close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div v-if="cartStore.isOpen" class="cart-drawer">
    <div class="cart-drawer__backdrop" @click="cartStore.close()"></div>

    <aside
      class="cart-drawer__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <header class="cart-drawer__header">
        <h2 id="cart-drawer-title" class="cart-drawer__title">Tu carrito</h2>
        <button
          type="button"
          class="cart-drawer__close"
          aria-label="Cerrar carrito"
          @click="cartStore.close()"
        >
          &times;
        </button>
      </header>

      <div class="cart-drawer__body">
        <p v-if="cartStore.items.length === 0" class="cart-drawer__empty">
          Tu carrito está vacío.
        </p>

        <ul v-else class="cart-drawer__items">
          <li v-for="item in cartStore.items" :key="item.variantId" class="cart-item">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.name"
              class="cart-item__image"
              loading="lazy"
            />
            <div v-else class="cart-item__image cart-item__image--empty" aria-hidden="true"></div>

            <div class="cart-item__info">
              <h3 class="cart-item__name">{{ item.name }}</h3>
              <p v-if="item.variantName" class="cart-item__variant">{{ item.variantName }}</p>
              <p class="cart-item__price">{{ formatPrice(item.price) }}</p>

              <div class="cart-item__actions">
                <div class="cart-item__qty">
                  <button
                    type="button"
                    class="cart-item__qty-btn"
                    :disabled="item.quantity <= 1"
                    :aria-label="`Restar una unidad de ${item.name}`"
                    @click="cartStore.updateQuantity(item.variantId, item.quantity - 1)"
                  >
                    −
                  </button>
                  <span class="cart-item__qty-value" aria-live="polite">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="cart-item__qty-btn"
                    :aria-label="`Sumar una unidad de ${item.name}`"
                    @click="cartStore.updateQuantity(item.variantId, item.quantity + 1)"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  class="cart-item__remove"
                  @click="cartStore.removeItem(item.variantId)"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <footer class="cart-drawer__footer">
        <div class="cart-drawer__subtotal">
          <span>Subtotal</span>
          <span class="cart-drawer__subtotal-value">{{ formatPrice(cartStore.subtotal) }}</span>
        </div>

        <BaseButton size="lg" block :disabled="cartStore.items.length === 0" @click="goToCheckout">
          Finalizar compra
        </BaseButton>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.cart-drawer {
  position: fixed;
  inset: 0;
  z-index: var(--z-drawer);
}

.cart-drawer__backdrop {
  position: absolute;
  inset: 0;
  background-color: rgb(0 0 0 / 60%);
}

.cart-drawer__panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: min(100%, 420px);
  background-color: var(--color-surface);
  border-left: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
}

.cart-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.cart-drawer__title {
  margin: 0;
  font-size: var(--text-xl);
}

.cart-drawer__close {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: var(--text-2xl);
  line-height: 1;
  color: var(--color-text-muted);
  background: none;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.cart-drawer__close:hover {
  color: var(--color-text);
  background-color: var(--color-surface-2);
}

.cart-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-5);
}

.cart-drawer__empty {
  margin: 0;
  padding: var(--space-8) 0;
  text-align: center;
  color: var(--color-text-muted);
}

.cart-drawer__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.cart-item {
  display: flex;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.cart-item__image {
  flex: none;
  width: 72px;
  height: 72px;
  object-fit: cover;
  background-color: var(--color-surface-2);
  border-radius: var(--radius-md);
}

.cart-item__info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.cart-item__name {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
  overflow-wrap: anywhere;
}

.cart-item__variant {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-violet-text);
}

.cart-item__price {
  margin: 0;
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.cart-item__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.cart-item__qty {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.cart-item__qty-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  font-size: var(--text-base);
  color: var(--color-text);
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.cart-item__qty-btn:hover:not(:disabled) {
  background-color: var(--color-surface-2);
}

.cart-item__qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cart-item__qty-value {
  min-width: 2ch;
  text-align: center;
  font-size: var(--text-sm);
}

.cart-item__remove {
  padding: 0;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-error);
  background: none;
  border: none;
  cursor: pointer;
}

.cart-item__remove:hover {
  text-decoration: underline;
}

.cart-drawer__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background-color: var(--color-surface-2);
  border-top: 1px solid var(--color-border);
}

.cart-drawer__subtotal {
  display: flex;
  justify-content: space-between;
  font-weight: var(--font-medium);
  color: var(--color-text-muted);
}

.cart-drawer__subtotal-value {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text);
}
</style>
