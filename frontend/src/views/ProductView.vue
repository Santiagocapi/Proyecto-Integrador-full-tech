
<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

import { api } from '@/services/api'
import { useCartStore } from '@/stores/cart'
import { useToast } from '@/composables/useToast'
import { formatPrice } from '@/utils/format'

import ProductGallery from '@/components/product/ProductGallery.vue'
import VariantSelector from '@/components/product/VariantSelector.vue'
import ProductSpecs from '@/components/product/ProductSpecs.vue'
import ProductCard from '@/components/product/ProductCard.vue'

const route = useRoute()
const cart = useCartStore()
const toast = useToast()

// Estado de la página
const product = ref(null)
const loading = ref(true)
const notFound = ref(false)
const errorMessage = ref('')
const selectedVariant = ref(null)
const quantity = ref(1)
const relatedProducts = ref([])

// Variantes del producto
const variants = computed(() => {
  return product.value?.product_variants
    || product.value?.variants
    || []
})

// Imagen principal
const image = computed(() => {
  return product.value?.images?.[0] ?? null
})

// Categoría
const category = computed(() => {
  return product.value?.categories?.name
    || product.value?.category?.name
    || ''
})

// Precio de la variante o del producto
const finalPrice = computed(() => {
  const variant = selectedVariant.value
  const currentProduct = product.value

  if (!currentProduct) return 0

  const variantPrice = Number(variant?.price)
  const productPrice = Number(currentProduct.price)

  const basePrice = variant && variant.price != null
    ? variantPrice
    : productPrice

  const offerPrice = Number(
    variant?.offer_price ?? currentProduct.offer_price
  )

  if (offerPrice > 0 && offerPrice < basePrice) {
    return offerPrice
  }

  return basePrice
})

// Precio anterior para mostrar ofertas
const originalPrice = computed(() => {
  if (!product.value) return 0

  return Number(
    selectedVariant.value?.price ?? product.value.price
  )
})

const hasOffer = computed(() => {
  return finalPrice.value > 0
    && originalPrice.value > finalPrice.value
})

// Stock de la variante seleccionada
const stock = computed(() => {
  if (!selectedVariant.value) return 0

  return Number(selectedVariant.value.stock ?? 0)
})

const hasStock = computed(() => stock.value > 0)

// Carga del producto
async function loadProduct(slug) {
  if (!slug) return

  loading.value = true
  notFound.value = false
  errorMessage.value = ''

  product.value = null
  selectedVariant.value = null
  relatedProducts.value = []
  quantity.value = 1

  try {
    const response = await api.get(
      `/products/${encodeURIComponent(slug)}`
    )

    // Admite respuesta directa o respuesta dentro de data
    const data = response?.data ?? response

    if (!data || !data.id) {
      notFound.value = true
      return
    }

    product.value = data

    // Seleccionamos la primera variante disponible
    const availableVariants = variants.value

    if (availableVariants.length > 0) {
      selectedVariant.value =
        availableVariants.find(v => Number(v.stock) > 0)
        || availableVariants[0]
    }

    // Cargamos los productos relacionados
    if (data.category_id) {
      await loadRelatedProducts(data.category_id, data.id)
    }
  } catch (err) {
    console.error('Error al cargar producto:', err)

    if (err.status === 404) {
      notFound.value = true
    } else {
      errorMessage.value =
        err.message || 'No se pudo cargar el producto.'

      toast.error(errorMessage.value)
    }
  } finally {
    loading.value = false
  }
}

// Productos relacionados
async function loadRelatedProducts(categoryId, currentId) {
  try {
    const response = await api.get(
      `/products?category=${encodeURIComponent(categoryId)}&limit=4`
    )

    const data = response?.data ?? response

    const items = Array.isArray(data)
      ? data
      : data?.items ?? data?.products ?? []

    relatedProducts.value = items
      .filter(item => item.id !== currentId)
      .slice(0, 4)
  } catch (err) {
    console.error('Error al cargar productos relacionados:', err)
    relatedProducts.value = []
  }
}

// Cambio de variante
function handleVariantChange(variant) {
  selectedVariant.value = variant
  quantity.value = 1
}

// Cantidad
function decreaseQuantity() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

function increaseQuantity() {
  if (quantity.value < stock.value) {
    quantity.value++
  }
}
// Agregar al carrito
function handleAddToCart() {
  if (!selectedVariant.value) {
    toast.error('Seleccioná una variante del producto.')
    return
  }

  if (!hasStock.value) {
    toast.error('Esta variante no tiene stock disponible.')
    return
  }

  if (quantity.value > stock.value) {
    toast.error('La cantidad supera el stock disponible.')
    return
  }

  try {
    cart.addItem(
      {
        variantId: selectedVariant.value.id,
        productId: product.value.id,
        name: product.value.name,
        variantName: selectedVariant.value.name,
        price: finalPrice.value,
        image: image.value || '',
        stock: stock.value,
      },
      quantity.value
    )

   toast.success(
      `${product.value.name} agregado al carrito.`
    )

    cart.open() 
  } catch (err) {
    console.error('Error al agregar al carrito:', err)
    toast.error('No se pudo agregar el producto al carrito.')
  }
}

// Recargar cuando cambia el slug de la ruta
watch(
  () => route.params.slug,
  (newSlug) => {
    loadProduct(newSlug)
  },
  { immediate: true }
)
</script>

<template>
  <main class="product-page">

    <!-- CARGANDO -->
    <section v-if="loading" class="product-state">
      <div class="loading-spinner"></div>
      <p>Cargando producto...</p>
    </section>

    <!-- PRODUCTO NO ENCONTRADO -->
    <section v-else-if="notFound" class="product-state">
      <h2>Producto no encontrado</h2>
      <p>El producto que buscás no existe o ya no está disponible.</p>

      <RouterLink to="/catalogo" class="back-button">
        Volver al catálogo
      </RouterLink>
    </section>

    <!-- ERROR -->
    <section v-else-if="errorMessage" class="product-state">
      <h2>No pudimos cargar el producto</h2>
      <p>{{ errorMessage }}</p>

      <RouterLink to="/catalogo" class="back-button">
        Volver al catálogo
      </RouterLink>
    </section>

    <!-- DETALLE DEL PRODUCTO -->
    <template v-else-if="product">

      <div class="product-topbar">
        <nav class="product-breadcrumb">
          <RouterLink to="/">Inicio</RouterLink>
          <span>/</span>
          <RouterLink to="/catalogo">Catálogo</RouterLink>
          <span>/</span>
          <span>{{ product.name }}</span>
        </nav>
      </div>

      <section class="product-detail-grid">

        <!-- GALERÍA -->
        <div class="product-media">
          <ProductGallery
            :images="product.images || []"
            :alt-name="product.name"
          />
        </div>

        <!-- INFORMACIÓN Y COMPRA -->
        <div class="product-purchase">

          <span v-if="category" class="product-badge">
            <span class="badge-dot"></span>
            {{ category }}
          </span>

          <span v-if="product.is_bundle" class="product-badge">
            Starter Pack / Kit
          </span>

          <h1 class="product-title">
            {{ product.name }}
          </h1>

          <p class="product-short-description">
            {{ product.short_description || product.description }}
          </p>

          <!-- PRECIO -->
          <div class="product-price-block">
            <div class="product-price-row">

              <strong class="product-price">
                {{ formatPrice(finalPrice) }}
              </strong>

              <span
                v-if="hasOffer"
                class="product-old-price"
              >
                {{ formatPrice(originalPrice) }}
              </span>

            </div>

            <p class="product-price-note">
              Precio expresado en pesos argentinos.
            </p>
          </div>

          <!-- SKU -->
          <p v-if="product.sku" class="product-sku">
            SKU: {{ product.sku }}
          </p>

          <!-- VARIANTES -->
          <VariantSelector
            v-if="variants.length"
            :variants="variants"
            @change="handleVariantChange"
          />

          <!-- STOCK -->
          <div
            v-if="selectedVariant"
            class="product-stock"
            :class="hasStock ? 'in-stock' : 'out-stock'"
          >
            <span class="stock-indicator"></span>

            <span v-if="hasStock">
              Disponible: {{ stock }} unidades
            </span>

            <span v-else>
              Producto agotado
            </span>
          </div>

          <div v-else class="product-stock out-stock">
            No hay variantes disponibles para este producto.
          </div>

          <!-- CANTIDAD Y CARRITO -->
          <div class="purchase-actions">

            <div class="quantity-control">
              <button
                type="button"
                aria-label="Disminuir cantidad"
                :disabled="quantity <= 1"
                @click="decreaseQuantity"
              >
                −
              </button>

              <span>{{ quantity }}</span>

              <button
                type="button"
                aria-label="Aumentar cantidad"
                :disabled="!hasStock || quantity >= stock"
                @click="increaseQuantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              class="add-cart-button"
              :disabled="!selectedVariant || !hasStock"
              @click="handleAddToCart"
            >
              <span class="cart-icon">🛒</span>

              {{ hasStock ? 'Agregar al carrito' : 'Sin stock' }}
            </button>

          </div>

          <!-- BENEFICIOS -->
          <div class="purchase-benefits">
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              Productos tecnológicos seleccionados
            </div>

            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              Compra segura a través de FULL-TECH
            </div>

            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              Consultá los medios de pago en el proceso de compra
            </div>
          </div>

        </div>
      </section>

      <!-- DESCRIPCIÓN, FICHA TÉCNICA Y COMPATIBILIDAD -->
      <section class="product-extra">
        <ProductSpecs
          :description="product.description || ''"
          :specs="product.specs || {}"
          :compatibility="product.compatibility || []"
        />
      </section>

      <!-- PRODUCTOS RELACIONADOS -->
      <section
        v-if="relatedProducts.length"
        class="related-section"
      >
        <div class="related-heading">
          <span class="section-eyebrow">
            TAMBIÉN TE PUEDE INTERESAR
          </span>

          <h2>Productos relacionados</h2>
        </div>

        <div class="related-grid">
          <ProductCard
            v-for="item in relatedProducts"
            :key="item.id"
            :product="item"
          />
        </div>
      </section>

    </template>

  </main>
</template>

<style scoped>
.product-page {
  width: min(1200px, calc(100% - 40px));
  margin: 0 auto;
  padding: 38px 0 70px;
  color: var(--color-text);
  font-family: var(--font-body);
}

.product-state {
  min-height: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  text-align: center;
  color: var(--color-text-muted);
}

.product-state h2 {
  color: var(--color-text);
  font-size: 1.6rem;
}

.loading-spinner {
  width: 38px;
  height: 38px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-cyan);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.back-button {
  display: inline-block;
  padding: 12px 20px;
  border-radius: 10px;
  background: var(--color-cyan);
  color: var(--color-text-on-accent);
  text-decoration: none;
  font-weight: 700;
}

.product-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 30px;
}

.product-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.product-breadcrumb a {
  color: var(--color-cyan);
  text-decoration: none;
}

.product-breadcrumb a:hover {
  text-decoration: underline;
}

.product-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  align-items: start;
  gap: clamp(28px, 4vw, 58px);
}

.product-detail-grid > * {
  min-width: 0;
}

.product-purchase {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 0;
}

.product-badge {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 8px;
  padding: 7px 12px;
  border: 1px solid rgba(0, 240, 255, 0.25);
  border-radius: 30px;
  background: rgba(0, 240, 255, 0.08);
  color: var(--color-cyan);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-cyan);
  box-shadow: var(--glow-cyan);
}

.product-title {
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 2.5vw, 2.25rem);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.product-short-description {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.7;
}

.product-price-block {
  padding: 18px 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.product-price-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 13px;
}

.product-price {
  color: var(--color-cyan);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 800;
  text-shadow: var(--text-glow-cyan);
}

.product-old-price {
  color: var(--color-text-muted);
  font-size: 1rem;
  text-decoration: line-through;
}

.product-price-note {
  margin-top: 5px;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.product-sku {
  margin-top: -12px;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  letter-spacing: 0.06em;
}

.product-stock {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 0.85rem;
  font-weight: 600;
}

.stock-indicator {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.in-stock {
  color: var(--color-success);
}

.in-stock .stock-indicator {
  background: var(--color-success);
  box-shadow: 0 0 9px rgba(46, 229, 157, 0.5);
}

.out-stock {
  color: var(--color-error);
}

.out-stock .stock-indicator {
  background: var(--color-error);
}

.purchase-actions {
  display: flex;
  align-items: stretch;
  gap: 12px;
}

.quantity-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 125px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.quantity-control button {
  width: 38px;
  height: 48px;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 1.3rem;
  cursor: pointer;
}

.quantity-control button:hover:not(:disabled) {
  color: var(--color-cyan);
  background: var(--color-surface-2);
}

.quantity-control button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.quantity-control span {
  min-width: 25px;
  text-align: center;
  font-weight: 700;
}

.add-cart-button {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 50px;
  padding: 12px 18px;
  border: 0;
  border-radius: 12px;
  background: var(--color-cyan);
  color: var(--color-text-on-accent);
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  box-shadow: var(--glow-cyan);
}

.add-cart-button:hover:not(:disabled) {
  transform: translateY(-2px);
  background: var(--color-cyan-hover);
}

.add-cart-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.cart-icon {
  font-size: 1.1rem;
}

.purchase-benefits {
  display: grid;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid var(--color-border);
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.benefit-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 23px;
  height: 23px;
  border-radius: 50%;
  background: rgba(0, 240, 255, 0.1);
  color: var(--color-cyan);
  font-weight: 800;
}

.product-extra {
  margin-top: 65px;
}

.related-section {
  margin-top: 65px;
}

.related-heading {
  margin-bottom: 24px;
}

.section-eyebrow {
  color: var(--color-cyan);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.related-heading h2 {
  margin-top: 8px;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.4rem;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

@media (max-width: 900px) {
  .product-detail-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 35px;
  }

  .product-purchase {
    padding: 0;
  }

  .related-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .product-page {
    width: calc(100% - 28px);
    padding-top: 22px;
  }

  .product-topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .purchase-actions {
    flex-direction: column;
  }

  .quantity-control {
    align-self: flex-start;
  }

  .add-cart-button {
    width: 100%;
  }

  .product-extra,
  .related-section {
    margin-top: 42px;
  }

  .related-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
}
</style>
