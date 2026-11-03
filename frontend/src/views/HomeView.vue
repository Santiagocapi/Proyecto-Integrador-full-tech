<script setup>
import HeroBanner from '@/components/home/HeroBanner.vue'
import CategoryGrid from '@/components/home/CategoryGrid.vue'
import FeaturedKits from '@/components/home/FeaturedKits.vue'
</script>

<template>
  <div class="home">
    <HeroBanner />
    <CategoryGrid />
    <FeaturedKits />
  </div>
</template>

<style scoped>
/* Separación pareja entre todas las secciones de la Home */
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  padding-bottom: var(--space-7);
}
</style>
