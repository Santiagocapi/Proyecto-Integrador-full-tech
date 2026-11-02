
<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/utils/format'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const route = useRoute()
const cart = useCartStore()

const product = ref(null)
const loading = ref(true)
const error = ref('')
const quantity = ref(1)
const addedMessage = ref('')

const image = computed(() => product.value?.images?.[0] ?? null)

const category = computed(() => product.value?.categories?.name ?? '')

const variant = computed(() => product.value?.product_variants?.[0] ?? null)

const specsEntries = computed(() => {
  const specs = product.value?.specs

  if (!specs) return []

  return Object.entries(specs)
})

const hasOffer = computed(() => {
  const price = Number(product.value?.price)
  const offer = Number(product.value?.offer_price)

  return offer > 0 && offer < price
})

const finalPrice = computed(() =>
  hasOffer.value ? Number(product.value.offer_price) : Number(product.value?.price),
)

async function loadProduct() {
  loading.value = true
  error.value = ''
  product.value = null
  quantity.value = 1
  addedMessage.value = ''

  try {
    product.value = await api.get(
      `/products/${encodeURIComponent(route.params.slug)}`,
    )
  } catch (err) {
    error.value = err.message || 'No se pudo cargar el producto.'
    console.error('Error al cargar producto:', err)
  } finally {
    loading.value = false
  }
}

function addToCart() {
  if (!variant.value || !product.value) return

  cart.addItem(
    {
      variantId: variant.value.id,
      productId: product.value.id,
      name: product.value.name,
      variantName: variant.value.name,
      price: finalPrice.value,
      image: image.value,
    },
    quantity.value,
  )

  addedMessage.value = '¡Producto agregado al carrito!'
}

watch(() => route.params.slug, loadProduct, { immediate: true })
</script>

<template>
  <section class="container section">
    <p v-if="loading">Cargando producto...</p>

    <p v-else-if="error">{{ error }}</p>

    <p v-else-if="!product">Producto no encontrado.</p>

    <div v-else class="product-detail">
      <div class="product-detail__media">
        <img
          v-if="image"
          :src="image"
          :alt="product.name"
          class="product-detail__image"
        />

        <p v-else>Imagen no disponible</p>
      </div>

      <div class="product-detail__info">
        <span v-if="category" class="product-detail__category">
          {{ category }}
        </span>

        <BaseBadge v-if="product.is_bundle" variant="violet">
          Starter Pack
        </BaseBadge>

        <h1>{{ product.name }}</h1>

        <p class="product-detail__description">
          {{ product.description }}
        </p>

        <div class="product-detail__prices">
          <strong>{{ formatPrice(finalPrice) }}</strong>

          <s v-if="hasOffer">
            {{ formatPrice(product.price) }}
          </s>
        </div>

        <div v-if="product.connection_type">
          <strong>Conexión:</strong>
          {{ product.connection_type }}
        </div>

        <div v-if="product.compatibility?.length">
          <h3>Compatibilidad</h3>
          <ul>
            <li v-for="item in product.compatibility" :key="item">
              {{ item }}
            </li>
          </ul>
        </div>

        <div v-if="specsEntries.length">
          <h3>Especificaciones</h3>
          <ul>
            <li v-for="[key, value] in specsEntries" :key="key">
              <strong>{{ key }}:</strong> {{ value }}
            </li>
          </ul>
        </div>

        <div v-if="product.is_bundle && product.bundle_items?.length">
          <h3>¿Qué incluye este Starter Pack?</h3>

          <ul>
            <li v-for="item in product.bundle_items" :key="item.product.id">
              {{ item.product.name }} × {{ item.quantity }}
            </li>
          </ul>
        </div>

        <div class="product-detail__purchase">
          <label for="quantity">Cantidad:</label>

          <input
            id="quantity"
            v-model.number="quantity"
            type="number"
            min="1"
            max="99"
          />

          <button
            type="button"
            :disabled="!variant || quantity < 1 || quantity > 99"
            @click="addToCart"
          >
            Agregar al carrito
          </button>
        </div>

        <p v-if="!variant">
          Este producto no tiene variantes disponibles.
        </p>

        <p v-if="addedMessage" role="status">
          {{ addedMessage }}
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.product-detail {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-8);
  align-items: start;
}

.product-detail__media {
  background: var(--color-surface-2);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.product-detail__image {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
}

.product-detail__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.product-detail__category {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
}

.product-detail__description {
  color: var(--color-text-muted);
  line-height: var(--leading-normal);
}

.product-detail__prices {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.product-detail__prices strong {
  font-size: var(--text-2xl);
}

.product-detail__prices s {
  color: var(--color-text-muted);
}

.product-detail__purchase {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.product-detail__purchase input {
  width: 75px;
  min-height: 44px;
  padding: var(--space-2);
  background-color: #ffffff;
  color: #000000;
  border: 1px solid #00e5ff;
  border-radius: var(--radius-md);
  font-weight: 700;
  text-align: center;
}
.product-detail__purchase button {
  min-height: 44px;
  padding: var(--space-3) var(--space-5);
  border: 1px solid var(--color-cyan);
  border-radius: var(--radius-md);
  background: var(--color-cyan);
  color: var(--color-text-on-accent);
  font-weight: var(--font-bold);
  cursor: pointer;
}

.product-detail__purchase button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .product-detail {
    grid-template-columns: 1fr;
  }

  .product-detail__media {
    min-height: 280px;
  }
}
</style>
