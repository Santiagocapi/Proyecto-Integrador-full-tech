<script setup>
import { RouterLink } from 'vue-router'
import ProductCard from '@/components/product/ProductCard.vue'
import ProductCardSkeleton from '@/components/product/ProductCardSkeleton.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useProducts } from '@/composables/useProducts'

// Reusa el composable del catálogo (Delfina): pide
// GET /api/products?category=starter-packs&limit=4 apenas se monta el componente.
const { products, loading, error, refetch } = useProducts(() => ({ category: 'starter-packs' }), {
  limit: 4,
})
</script>

<template>
  <section class="container" aria-labelledby="kits-title" :aria-busy="loading">
    <div class="section-header">
      <h2 id="kits-title" class="section-title">
        <span class="accent-magenta">Starter Packs</span> destacados
      </h2>
      <RouterLink :to="{ name: 'catalog', query: { category: 'starter-packs' } }" class="see-all">
        Ver todos los kits
      </RouterLink>
    </div>

    <div v-if="loading" class="grid-products">
      <ProductCardSkeleton v-for="n in 4" :key="n" />
    </div>

    <div v-else-if="error" class="state" role="alert">
      <p>No pudimos cargar los kits. {{ error }}</p>
      <BaseButton variant="secondary" size="sm" @click="refetch">Reintentar</BaseButton>
    </div>

    <div v-else-if="products.length" class="grid-products">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>

    <p v-else class="state">Todavía no hay kits publicados.</p>
  </section>
</template>

<style scoped>
.see-all {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
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
