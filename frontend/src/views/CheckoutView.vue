<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ShippingForm from '@/components/checkout/ShippingForm.vue'
import PaymentMethod from '@/components/checkout/PaymentMethod.vue'
import OrderSummary from '@/components/checkout/OrderSummary.vue'
import { api } from '@/services/api'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { redirectTo } from '@/utils/redirect'

const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()
const toast = useToast()

const shippingFormRef = ref(null)
const shipping = ref({ name: '', address: '', city: '', zip: '', phone: '' })
const paymentMethod = ref('mercadopago')
const submitting = ref(false)

// Precarga los datos de envío desde el perfil, sin pisar lo que el usuario ya escribió
watch(
  () => auth.profile,
  (profile) => {
    if (!profile) return
    const fromProfile = {
      name: profile.full_name,
      address: profile.address,
      city: profile.city,
      zip: profile.zip,
      phone: profile.phone,
    }
    const next = { ...shipping.value }
    for (const [key, value] of Object.entries(fromProfile)) {
      if (!next[key] && value) next[key] = value
    }
    shipping.value = next
  },
  { immediate: true },
)

onMounted(() => {
  if (cart.items.length === 0) router.replace('/catalogo')
})

// Arma el mensaje de error de stock con el producto y lo disponible
function stockMessage(details) {
  if (!details?.product_name) return null
  const variant =
    details.variant_name && details.variant_name !== 'Único' ? ` (${details.variant_name})` : ''
  const available = Number(details.available) || 0
  const left = available === 0 ? 'no quedan unidades' : `quedan ${available} disponibles`
  return `Stock insuficiente para ${details.product_name}${variant}: ${left}. Ajustá la cantidad en el carrito.`
}

function handleError(error) {
  if (error?.status === 409) {
    toast.error(stockMessage(error.details) ?? error.message)
    return
  }
  if (error?.status === 400 && error.message === 'El carrito está vacío') {
    toast.error('Tu carrito está vacío')
    router.replace('/catalogo')
    return
  }
  toast.error(error?.message || 'No se pudo crear el pedido')
}

async function confirmOrder() {
  // Evita el doble envío mientras hay un pedido en curso
  if (submitting.value) return
  if (!shippingFormRef.value?.validate()) {
    toast.error('Revisá los datos de envío')
    return
  }

  submitting.value = true
  const { name, address, city, zip, phone } = shipping.value
  const payload = {
    shipping: {
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      // El backend sólo acepta el CPA en mayúsculas
      zip: zip.trim().toUpperCase(),
      phone: phone.trim(),
    },
    paymentMethod: paymentMethod.value,
  }

  try {
    await cart.flushSync()
    const order = await api.post('/orders', payload, { auth: true })
    // El servidor ya vació el carrito en la BD: vaciamos el local antes de salir
    // para que la sincronización no vuelva a subir los ítems viejos
    cart.clearCart()
    if (order.payment_url) {
      redirectTo(order.payment_url)
    } else {
      router.push(`/confirmacion/${order.tracking_code}`)
    }
  } catch (error) {
    handleError(error)
    submitting.value = false
  }
}
</script>

<template>
  <div class="checkout">
    <header class="checkout__header">
      <h1 class="checkout__title">Finalizar compra</h1>
      <p class="checkout__subtitle">Completá los datos de envío y elegí cómo pagar.</p>
    </header>

    <div class="checkout__layout">
      <div class="checkout__main">
        <div class="checkout__card">
          <ShippingForm ref="shippingFormRef" v-model="shipping" />
        </div>
        <div class="checkout__card">
          <PaymentMethod v-model="paymentMethod" />
        </div>
      </div>

      <OrderSummary
        class="checkout__summary"
        :items="cart.items"
        :subtotal="cart.subtotal"
        :loading="submitting"
        @confirm="confirmOrder"
      />
    </div>
  </div>
</template>

<style scoped>
.checkout {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
}

.checkout__header {
  margin-bottom: var(--space-5);
}

.checkout__title {
  font-size: var(--text-3xl);
  color: var(--color-cyan);
  text-shadow: var(--text-glow-cyan);
}

.checkout__subtitle {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
}

.checkout__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
}

.checkout__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.checkout__card {
  padding: var(--space-5);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}

/* Escritorio: formulario a la izquierda, resumen fijo a la derecha */
@media (min-width: 1024px) {
  .checkout__layout {
    grid-template-columns: minmax(0, 1fr) 380px;
    align-items: start;
  }

  .checkout__summary {
    position: sticky;
    top: calc(var(--space-9) + var(--space-4));
  }
}
</style>
