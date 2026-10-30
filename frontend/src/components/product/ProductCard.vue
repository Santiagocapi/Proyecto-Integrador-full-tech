<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { formatPrice } from '@/utils/format'

// product: un producto como lo devuelve GET /api/products
// { name, slug, price, offer_price, images, is_bundle, category: { name } }
const props = defineProps({
  product: { type: Object, required: true },
})

const image = computed(() => props.product.images?.[0] ?? null)

const hasOffer = computed(() => {
  const offer = Number(props.product.offer_price)
  return offer > 0 && offer < Number(props.product.price)
})

const finalPrice = computed(() =>
  hasOffer.value ? props.product.offer_price : props.product.price,
)

const discount = computed(() => {
  if (!hasOffer.value) return null
  const percent = Math.round((1 - props.product.offer_price / props.product.price) * 100)
  return `-${percent}%`
})
</script>

<template>
  <RouterLink :to="{ name: 'product', params: { slug: product.slug } }" class="card product-card">
    <div class="product-card__media">
      <div class="product-card__badges">
        <BaseBadge v-if="product.is_bundle" variant="violet">Kit</BaseBadge>
        <span v-if="discount" class="product-card__discount">{{ discount }}</span>
      </div>

      <img
        v-if="image"
        :src="image"
        :alt="product.name"
        class="product-card__image"
        loading="lazy"
        width="400"
        height="400"
      />
      <div v-else class="product-card__placeholder" aria-hidden="true">
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linejoin="round"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="M21 16l-5-5-8 8" />
        </svg>
      </div>
    </div>

    <div class="product-card__body">
      <span v-if="product.category?.name" class="product-card__category">
        {{ product.category.name }}
      </span>
      <h3 class="product-card__name">{{ product.name }}</h3>
      <div class="product-card__prices">
        <strong class="product-card__price">{{ formatPrice(finalPrice) }}</strong>
        <s v-if="hasOffer" class="product-card__old-price">
          <span class="sr-only">Antes:</span>
          {{ formatPrice(product.price) }}
        </s>
      </div>
      <span class="product-card__cta">Ver producto</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--color-text);
}

.product-card:hover {
  color: var(--color-text);
}

.product-card__media {
  position: relative;
  aspect-ratio: 1 / 1;
  background-color: var(--color-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-card__badges {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  right: var(--space-3);
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
}

/* Si solo hay descuento, queda a la derecha */
.product-card__discount {
  margin-left: auto;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  background-color: var(--color-cyan);
  color: var(--color-text-on-accent);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  line-height: 1;
}

.product-card__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: var(--space-5);
}

.product-card__placeholder {
  color: var(--color-text-muted);
}

.product-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5) var(--space-5);
}

.product-card__category {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.product-card__name {
  flex: 1;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  letter-spacing: 0;
  line-height: var(--leading-normal);
}

.product-card__prices {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
}

.product-card__price {
  font-size: var(--text-xl);
}

.product-card__old-price {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.product-card__cta {
  margin-top: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border: 1px solid var(--color-cyan);
  border-radius: var(--radius-md);
  color: var(--color-cyan);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.product-card:hover .product-card__cta {
  background-color: var(--color-cyan);
  color: var(--color-text-on-accent);
}
</style>
