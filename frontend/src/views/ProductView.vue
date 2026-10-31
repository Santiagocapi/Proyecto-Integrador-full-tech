<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'
import { useCartStore } from '@/stores/cart'
import { useToast } from '@/composables/useToast'

import ProductGallery from '@/components/product/ProductGallery.vue'
import VariantSelector from '@/components/product/VariantSelector.vue'
import ProductSpecs from '@/components/product/ProductSpecs.vue'
import ProductCard from '@/components/product/ProductCard.vue'

const route = useRoute()
const cart = useCartStore()
const { success, error } = useToast()

const product = ref(null)
const loading = ref(true)
const notFound = ref(false)
const selectedVariant = ref(null)
const quantity = ref(1)
const relatedProducts = ref([])

const fetchProductData = async (slug) => {
  loading.value = true
  notFound.value = false

  try {
    const response = await api.get(`/products/${slug}`)
    product.value = response.data || response

    if (
      product.value.product_variants &&
      product.value.product_variants.length > 0
    ) {
      selectedVariant.value = product.value.product_variants[0]
    } else {
      selectedVariant.value = null
    }

    quantity.value = 1
    relatedProducts.value = []

    if (product.value.category_id) {
      fetchRelatedProducts(product.value.category_id, product.value.id)
    }
  } catch (err) {
    if (err.status === 404) {
      notFound.value = true
    } else {
      error('Error al cargar el producto')
    }
  } finally {
    loading.value = false
  }
}

const fetchRelatedProducts = async (categoryId, currentId) => {
  try {
    const res = await api.get(`/products?category=${categoryId}&limit=4`)
    relatedProducts.value = (res.items || res).filter(
      p => p.id !== currentId
    )
  } catch (err) {
    console.error('Error cargando relacionados', err)
  }
}

const handleVariantChange = (variant) => {
  selectedVariant.value = variant
  quantity.value = 1
}

const handleAddToCart = () => {
  if (!selectedVariant.value) return

  try {
    cart.addItem({
      variantId: selectedVariant.value.id,
      productId: product.value.id,
      name: product.value.name,
      variantName: selectedVariant.value.name,
      price: selectedVariant.value.offer_price || product.value.price,
      image: product.value.images?.[0] || '',
      stock: selectedVariant.value.stock
    }, quantity.value)

    success(`¡${product.value.name} agregado al carrito!`)
    cart.open()
  } catch {
    error('No se pudo agregar al carrito')
  }
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const increaseQuantity = () => {
  if (
    selectedVariant.value &&
    quantity.value < selectedVariant.value.stock
  ) {
    quantity.value++
  }
}

watch(() => route.params.slug, (newSlug) => {
  if (newSlug) fetchProductData(newSlug)
})

onMounted(() => {
  fetchProductData(route.params.slug)
})
</script>

<template>
  <main class="product-page">

    <!-- Cargando -->
    <div v-if="loading" class="product-state">
      <div class="loading-spinner"></div>
      <p>Cargando producto...</p>
    </div>

    <!-- Producto no encontrado -->
    <div v-else-if="notFound" class="product-state">
      <h2>Producto no encontrado</h2>
      <p>El producto que buscás no está disponible.</p>
      <RouterLink to="/" class="back-button">
        Volver al inicio
      </RouterLink>
    </div>

    <!-- Detalle del producto -->
    <div v-else-if="product" class="product-content">

      <!-- Navegación y calificación -->
      <div class="product-topbar">
        <div class="product-breadcrumb">
          <RouterLink to="/">Inicio</RouterLink>
          <span>/</span>
          <span>Catálogo</span>
          <span>/</span>
          <span>{{ product.category?.name || 'Tecnología' }}</span>
        </div>

        <div class="product-rating">
          <span class="rating-star">★</span>
          <strong>{{ product.rating || '4.9' }}</strong>
          <span class="rating-reviews">
            ({{ product.reviewsCount || 142 }} opiniones)
          </span>
        </div>
      </div>

      <!-- Galería y compra -->
      <section class="product-detail-grid">

        <!-- Imágenes -->
        <ProductGallery
          :images="product.images || []"
          :alt-name="product.name"
        />

        <!-- Información de compra -->
        <div class="product-purchase">

          <div class="purchase-heading">
            <span class="product-badge">
              <span class="badge-dot"></span>
              Tendencia hoy
            </span>

            <h1 class="product-title">
              {{ product.name }}
            </h1>

            <p class="product-short-description">
              {{ product.short_description || product.description || 'Descubrí todos los detalles de este producto.' }}
            </p>
          </div>

          <!-- Precio -->
          <div class="product-price-block">
            <div class="product-price-row">
              <span class="product-price">
                ${{ Number(selectedVariant?.offer_price || product.price || 0).toLocaleString('es-AR') }}
              </span>

              <span
                v-if="selectedVariant?.offer_price || product.offer_price"
                class="product-old-price"
              >
                ${{ Number(product.price || 0).toLocaleString('es-AR') }}
              </span>
            </div>

            <p class="product-price-note">
              Precio expresado en pesos argentinos
            </p>
          </div>

          <p class="product-sku" v-if="product.sku">
            SKU: {{ product.sku }}
          </p>

          <!-- Variantes -->
          <VariantSelector
            v-if="product.product_variants?.length"
            :variants="product.product_variants"
            @change="handleVariantChange"
          />

          <!-- Disponibilidad -->
          <div
            v-if="selectedVariant"
            class="product-stock"
            :class="selectedVariant.stock > 0 ? 'in-stock' : 'out-stock'"
          >
            <span class="stock-indicator"></span>
            <span v-if="selectedVariant.stock > 0">
              Disponible · {{ selectedVariant.stock }} unidades
            </span>
            <span v-else>
              Producto agotado
            </span>
          </div>

          <!-- Cantidad y carrito -->
          <div
            v-if="selectedVariant"
            class="purchase-actions"
          >
            <div class="quantity-control">
              <button
                type="button"
                @click="decreaseQuantity"
                :disabled="quantity <= 1"
                aria-label="Disminuir cantidad"
              >
                −
              </button>

              <span>{{ quantity }}</span>

              <button
                type="button"
                @click="increaseQuantity"
                :disabled="quantity >= selectedVariant.stock"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>

            <button
              type="button"
              class="add-cart-button"
              @click="handleAddToCart"
              :disabled="selectedVariant.stock <= 0"
            >
              <span class="cart-icon">🛒</span>
              Agregar al carrito
            </button>
          </div>

          <!-- Beneficios -->
          <div class="purchase-benefits">
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span>Compra segura</span>
            </div>

            <div class="benefit-item">
              <span class="benefit-icon">↗</span>
              <span>Calidad garantizada</span>
            </div>

            <div class="benefit-item">
              <span class="benefit-icon">₱</span>
              <span>Medios de pago disponibles</span>
            </div>
          </div>

        </div>
      </section>

      <!-- Descripción y ficha técnica -->
      <section class="product-extra">
        <ProductSpecs
          :description="product.description || ''"
          :specs="product.specs || {}"
          :compatibility="product.compatibility || []"
        />
      </section>

      <!-- Productos relacionados -->
      <section
        v-if="relatedProducts.length"
        class="related-section"
      >
        <div class="related-heading">
          <div>
            <span class="section-eyebrow">SELECCIÓN FULL-TECH</span>
            <h2>También te puede interesar</h2>
          </div>
        </div>

        <div class="related-grid">
          <ProductCard
            v-for="related in relatedProducts"
            :key="related.id"
            :product="related"
          />
        </div>
      </section>

    </div>
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

.product-rating {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 13px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  white-space: nowrap;
  font-size: 0.85rem;
}

.rating-star {
  color: #ffc857;
  font-size: 1.2rem;
}

.rating-reviews {
  color: var(--color-text-muted);
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
  margin: 16px 0 10px;
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