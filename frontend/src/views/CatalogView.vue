<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProducts } from '@/composables/useProducts'
import FilterPanel from '@/components/catalog/FilterPanel.vue'
import SortSelect from '@/components/catalog/SortSelect.vue'
import ProductCard from '@/components/product/ProductCard.vue'

const route = useRoute()
const router = useRouter()

// --- Filtros: la fuente de verdad es la URL ---------------------------------
const first = (v) => (Array.isArray(v) ? v[0] : v) || ''

const filters = computed(() => ({
  q: first(route.query.q),
  category: first(route.query.category),
  minPrice: first(route.query.minPrice),
  maxPrice: first(route.query.maxPrice),
  connection: first(route.query.connection),
  compat: first(route.query.compat) ? first(route.query.compat).split(',') : [],
  sort: first(route.query.sort),
}))

// "Cargar más" no va en la URL: al recargar se vuelve a la primera página
const page = ref(1)
const requestFilters = computed(() => ({ ...filters.value, page: page.value }))

function setFilters(next) {
  const query = {}
  for (const [key, value] of Object.entries(next)) {
    if (Array.isArray(value) ? value.length : value) {
      query[key] = Array.isArray(value) ? value.join(',') : value
    }
  }
  router.replace({ query })
}

function setSort(sort) {
  setFilters({ ...filters.value, sort })
}

function clearFilters() {
  router.replace({ query: {} })
}

// Cualquier cambio de filtros vuelve a la página 1
watch(filters, () => (page.value = 1), { deep: true })

// --- Datos -------------------------------------------------------------------
const { products, total, pages, loading, error, refetch } = useProducts(requestFilters)

const hasFilters = computed(() => Object.values(filters.value).some((v) => (Array.isArray(v) ? v.length : v)))
const isFirstLoad = computed(() => loading.value && page.value === 1)
const canLoadMore = computed(() => page.value < pages.value)

// --- Panel móvil -------------------------------------------------------------
const filtersOpen = ref(false)
</script>

<template>
  <div class="catalog container">
    <header class="topbar">
      <h1>Catálogo</h1>
      <p class="count" aria-live="polite">
        <template v-if="!isFirstLoad && !error">{{ total }} {{ total === 1 ? 'producto' : 'productos' }}</template>
      </p>
      <SortSelect :model-value="filters.sort" @update:model-value="setSort" />
      <button class="filters-btn" type="button" @click="filtersOpen = true">Filtros</button>
    </header>

    <div class="layout">
      <FilterPanel
        :model-value="filters"
        :open="filtersOpen"
        @update:model-value="setFilters"
        @close="filtersOpen = false"
        @clear="clearFilters"
      />

      <section class="results">
        <!-- Cargando (primera página): skeletons -->
        <ul v-if="isFirstLoad" class="grid" aria-busy="true">
          <li v-for="n in 8" :key="n" class="skeleton" />
        </ul>

        <!-- Error -->
        <div v-else-if="error" class="state" role="alert">
          <p>{{ error }}</p>
          <button type="button" @click="refetch">Reintentar</button>
        </div>

        <!-- Sin resultados -->
        <div v-else-if="!products.length" class="state">
          <p>No encontramos productos con esos filtros.</p>
          <button v-if="hasFilters" type="button" @click="clearFilters">Limpiar filtros</button>
        </div>

        <!-- Resultados -->
        <template v-else>
          <ul class="grid">
            <li v-for="p in products" :key="p.slug">
              <ProductCard :product="p" />
            </li>
          </ul>
          <button v-if="canLoadMore" class="more" type="button" :disabled="loading" @click="page++">
            {{ loading ? 'Cargando…' : 'Cargar más' }}
          </button>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.catalog { padding-block: 1.5rem; }
.topbar { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.75rem 1rem; margin-bottom: 1.25rem; }
.count { margin: 0; opacity: 0.7; flex: 1; }
.filters-btn {
  padding: 0.5rem 1rem;
  color: var(--color-cyan);
  background: none;
  border: 1px solid var(--color-cyan);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.layout { display: block; }
.grid {
  display: grid;
  grid-template-columns: 1fr; /* móvil: 1 columna */
  gap: 1rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.skeleton {
  min-height: 280px;
  border-radius: var(--radius-xl);
  background: linear-gradient(90deg, #17171f 25%, #20202b 50%, #17171f 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
}
@keyframes shimmer { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }

.state { padding: 3rem 1rem; text-align: center; }
.state button, .more {
  margin-top: 1rem;
  padding: 0.6rem 1.25rem;
  color: inherit;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}
.more { display: block; margin-inline: auto; margin-top: 2rem; }
.more:disabled { opacity: 0.6; cursor: wait; }

@media (min-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } } /* tablet */
@media (min-width: 1024px) {
  .layout { display: grid; grid-template-columns: 240px 1fr; gap: 2rem; align-items: start; }
  .filters-btn { display: none; }
  .grid { grid-template-columns: repeat(3, 1fr); } /* desktop */
}
@media (min-width: 1280px) { .grid { grid-template-columns: repeat(4, 1fr); } }
</style>
