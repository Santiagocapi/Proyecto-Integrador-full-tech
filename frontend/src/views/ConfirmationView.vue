<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { api } from '@/services/api'
import { useCartStore } from '@/stores/cart'
import { formatDate, formatPrice } from '@/utils/format'

const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 5

const route = useRoute()
const cart = useCartStore()

const order = ref(null)
const loading = ref(true)
const notFound = ref(false)
const loadError = ref('')
const polls = ref(0)
let pollTimer = null
let active = true

const STATUS_INFO = {
  pendiente: { label: 'Pendiente', variant: 'warning' },
  pagado: { label: 'Pagado', variant: 'success' },
  enviado: { label: 'Enviado', variant: 'cyan' },
  entregado: { label: 'Entregado', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'error' },
}

const PAYMENT_LABELS = {
  mercadopago: 'Mercado Pago',
  transferencia: 'Transferencia bancaria',
  efectivo: 'Efectivo al retirar',
}

// Mercado Pago vuelve con ?status=... o ?collection_status=...
const paymentQueryStatus = computed(() => route.query.status ?? route.query.collection_status ?? null)

const statusInfo = computed(
  () => STATUS_INFO[order.value?.status] ?? { label: order.value?.status ?? '', variant: 'neutral' },
)

const isAwaitingMercadoPago = computed(
  () => order.value?.status === 'pendiente' && order.value?.payment_method === 'mercadopago',
)

// Mensaje principal según el estado del pedido y lo que informó Mercado Pago
const message = computed(() => {
  const current = order.value
  if (!current) return null
  if (current.status === 'pagado') {
    return { tone: 'success', title: '¡Pago aprobado!', text: 'Ya estamos preparando tu pedido.' }
  }
  if (current.status === 'pendiente' && paymentQueryStatus.value === 'rejected') {
    return {
      tone: 'error',
      title: 'El pago fue rechazado',
      text: 'Tu pedido sigue pendiente de pago. Podés contactarnos o intentar nuevamente más tarde.',
    }
  }
  if (isAwaitingMercadoPago.value) {
    return polls.value >= MAX_POLLS
      ? {
          tone: 'info',
          title: 'Estamos confirmando tu pago...',
          text: 'La acreditación puede demorar unos minutos. Podés revisar el estado en "Mis pedidos".',
        }
      : {
          tone: 'info',
          title: 'Estamos confirmando tu pago...',
          text: 'Esto puede tardar unos segundos.',
        }
  }
  if (current.status === 'pendiente') {
    return {
      tone: 'info',
      title: '¡Recibimos tu pedido!',
      text: 'Nos vamos a contactar para coordinar el pago. El pedido queda pendiente hasta que confirmemos el pago.',
    }
  }
  if (current.status === 'cancelado') {
    return { tone: 'error', title: 'Pedido cancelado', text: 'Si tenés dudas, contactanos.' }
  }
  return { tone: 'success', title: '¡Gracias por tu compra!', text: '' }
})

function shouldPoll() {
  return isAwaitingMercadoPago.value && paymentQueryStatus.value !== 'rejected' && polls.value < MAX_POLLS
}

function schedulePoll() {
  clearTimeout(pollTimer)
  if (!active || !shouldPoll()) return
  pollTimer = setTimeout(async () => {
    polls.value++
    await fetchOrder()
  }, POLL_INTERVAL_MS)
}

async function fetchOrder() {
  try {
    const data = await api.get(`/orders/${encodeURIComponent(route.params.tracking)}`, { auth: true })
    if (!active) return
    order.value = data
  } catch (error) {
    if (!active) return
    // Si falla un reintento, mantenemos el pedido que ya se mostraba
    if (!order.value) {
      if (error?.status === 404) notFound.value = true
      else loadError.value = error?.message || 'No se pudo cargar el pedido'
    }
  } finally {
    if (active) loading.value = false
  }
  schedulePoll()
}

onMounted(() => {
  // El backend ya vació el carrito en la BD; nos aseguramos de que el local también quede vacío
  cart.clearCart()
  fetchOrder()
})

onBeforeUnmount(() => {
  active = false
  clearTimeout(pollTimer)
})

const variantLabel = (item) =>
  item.variant_name && item.variant_name !== 'Único' ? item.variant_name : ''
</script>

<template>
  <div class="confirmation">
    <p v-if="loading" class="confirmation__state" role="status">Cargando tu pedido...</p>

    <section v-else-if="notFound" class="confirmation__state confirmation__card">
      <h1 class="confirmation__title">Pedido no encontrado</h1>
      <p>Revisá el código de seguimiento o buscá el pedido en tu cuenta.</p>
      <div class="confirmation__actions">
        <RouterLink to="/cuenta" class="confirmation__link">Ver mis pedidos</RouterLink>
        <RouterLink to="/catalogo" class="confirmation__link">Volver al catálogo</RouterLink>
      </div>
    </section>

    <section v-else-if="loadError" class="confirmation__state confirmation__card">
      <h1 class="confirmation__title">No pudimos cargar tu pedido</h1>
      <p>{{ loadError }}</p>
      <div class="confirmation__actions">
        <RouterLink to="/cuenta" class="confirmation__link">Ver mis pedidos</RouterLink>
      </div>
    </section>

    <template v-else-if="order">
      <header class="confirmation__header">
        <div
          class="confirmation__message"
          :class="`confirmation__message--${message.tone}`"
          role="status"
          aria-live="polite"
        >
          <h1 class="confirmation__title">{{ message.title }}</h1>
          <p v-if="message.text">{{ message.text }}</p>
        </div>

        <div class="confirmation__tracking">
          <span class="confirmation__tracking-label">Código de seguimiento</span>
          <strong class="confirmation__tracking-code">{{ order.tracking_code }}</strong>
          <BaseBadge :variant="statusInfo.variant">{{ statusInfo.label }}</BaseBadge>
        </div>
      </header>

      <div class="confirmation__grid">
        <section class="confirmation__card" aria-labelledby="confirmation-items-title">
          <h2 id="confirmation-items-title" class="confirmation__subtitle">Tu pedido</h2>
          <ul class="confirmation__items">
            <li v-for="item in order.items" :key="item.variant_id" class="confirmation__item">
              <div class="confirmation__item-info">
                <span class="confirmation__item-name">{{ item.product_name }}</span>
                <span v-if="variantLabel(item)" class="confirmation__item-variant">
                  {{ variantLabel(item) }}
                </span>
                <span class="confirmation__item-qty">
                  {{ item.quantity }} × {{ formatPrice(item.unit_price) }}
                </span>
              </div>
              <span class="confirmation__item-total">
                {{ formatPrice(item.unit_price * item.quantity) }}
              </span>
            </li>
          </ul>
          <div class="confirmation__total">
            <span>Total</span>
            <strong>{{ formatPrice(order.total) }}</strong>
          </div>
        </section>

        <section class="confirmation__card" aria-labelledby="confirmation-details-title">
          <h2 id="confirmation-details-title" class="confirmation__subtitle">Envío y pago</h2>
          <dl class="confirmation__details">
            <div>
              <dt>Recibe</dt>
              <dd>{{ order.shipping?.name }}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>
                {{ order.shipping?.address }}, {{ order.shipping?.city }} ({{ order.shipping?.zip }})
              </dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd>{{ order.shipping?.phone }}</dd>
            </div>
            <div>
              <dt>Método de pago</dt>
              <dd>{{ PAYMENT_LABELS[order.payment_method] ?? order.payment_method }}</dd>
            </div>
            <div v-if="order.created_at">
              <dt>Fecha</dt>
              <dd>{{ formatDate(order.created_at) }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div class="confirmation__actions">
        <RouterLink to="/cuenta" class="confirmation__link">Ver mis pedidos</RouterLink>
        <RouterLink to="/catalogo" class="confirmation__link confirmation__link--ghost">
          Seguir comprando
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.confirmation {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.confirmation__state {
  text-align: center;
  color: var(--color-text-muted);
}

.confirmation__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}

.confirmation__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.confirmation__message {
  padding: var(--space-4) var(--space-5);
  border: 1px solid currentColor;
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
}

.confirmation__message p {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
}

.confirmation__message--success {
  color: var(--color-success);
}

.confirmation__message--error {
  color: var(--color-error);
}

.confirmation__message--info {
  color: var(--color-cyan);
}

.confirmation__title {
  font-size: var(--text-2xl);
}

.confirmation__tracking {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.confirmation__tracking-label {
  width: 100%;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.confirmation__tracking-code {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  color: var(--color-cyan);
  text-shadow: var(--text-glow-cyan);
  word-break: break-all;
}

.confirmation__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
}

.confirmation__subtitle {
  font-size: var(--text-xl);
}

.confirmation__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.confirmation__item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.confirmation__item-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.confirmation__item-name {
  font-weight: var(--font-medium);
}

.confirmation__item-variant {
  font-size: var(--text-sm);
  color: var(--color-violet-text);
}

.confirmation__item-qty {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.confirmation__item-total {
  flex: none;
  font-weight: var(--font-semibold);
}

.confirmation__total {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-lg);
}

.confirmation__total strong {
  color: var(--color-cyan);
}

.confirmation__details {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
}

.confirmation__details dt {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.confirmation__details dd {
  margin: 0;
}

.confirmation__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
}

.confirmation__link {
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  background-color: var(--color-cyan);
  color: var(--color-text-on-accent);
  font-weight: var(--font-semibold);
  text-decoration: none;
  transition: box-shadow var(--transition-fast);
}

.confirmation__link:hover,
.confirmation__link:focus-visible {
  box-shadow: var(--glow-cyan);
  text-decoration: none;
}

.confirmation__link--ghost {
  background-color: transparent;
  border: 2px solid var(--color-magenta);
  color: var(--color-magenta);
}

.confirmation__link--ghost:hover,
.confirmation__link--ghost:focus-visible {
  box-shadow: var(--glow-magenta);
}

@media (min-width: 1024px) {
  .confirmation__grid {
    grid-template-columns: 3fr 2fr;
    align-items: start;
  }
}
</style>
