<script setup>
import { RouterLink } from 'vue-router'
import ProductCard from '@/components/product/ProductCard.vue'
import ProductCardSkeleton from '@/components/product/ProductCardSkeleton.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useProducts } from '@/composables/useProducts'

// GET /api/products?sort=newest&limit=8: los 8 productos cargados más recientemente
const { products, loading, error, refetch } = useProducts(() => ({ sort: 'newest' }), {
  limit: 8,
})
</script>

<template>
  <section class="container" aria-labelledby="new-title" :aria-busy="loading">
    <div class="section-header">
      <h2 id="new-title" class="section-title"><span class="accent-cyan">Recién</span> llegados</h2>
      <RouterLink :to="{ name: 'catalog', query: { sort: 'newest' } }" class="see-all">
        Ver catálogo completo
      </RouterLink>
    </div>

    <div v-if="error" class="state" role="alert">
      <p>No pudimos cargar los productos nuevos. {{ error }}</p>
      <BaseButton variant="secondary" size="sm" @click="refetch">Reintentar</BaseButton>
    </div>

    <p v-else-if="!loading && !products.length" class="state">Todavía no hay productos.</p>

    <!-- En celular es un carrusel con scroll horizontal; en desktop, una grilla de 4 columnas -->
    <ul v-else class="carousel scroll-x" aria-label="Productos nuevos">
      <template v-if="loading">
        <li v-for="n in 4" :key="n" class="carousel__item">
          <ProductCardSkeleton />
        </li>
      </template>
      <template v-else>
        <li v-for="product in products" :key="product.id" class="carousel__item">
          <ProductCard :product="product" />
        </li>
      </template>
    </ul>
  </section>
</template>

<style scoped>
.see-all {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.carousel {
  display: grid;
  grid-auto-flow: column;
  /* Se ve una tarjeta y un pedazo de la siguiente: invita a deslizar */
  grid-auto-columns: 78%;
  gap: var(--space-4);
  padding-bottom: var(--space-3);
  scroll-snap-type: x mandatory;
}

.carousel__item {
  scroll-snap-align: start;
}

@media (min-width: 768px) {
  .carousel {
    grid-auto-columns: calc((100% - var(--space-4) * 2) / 3);
  }
}

@media (min-width: 1024px) {
  .carousel {
    grid-auto-flow: row;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-5);
    overflow: visible;
    padding-bottom: 0;
  }
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-7) var(--space-4);
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
  text-align: center;
}
</style>
