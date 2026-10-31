
<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '@/components/product/ProductCard.vue'
import { api } from '@/services/api'

const route = useRoute()

const products = ref([])
const loading = ref(true)
const error = ref('')

watch(
  () => route.query.category,
  async (category) => {
    loading.value = true
    error.value = ''

    try {
      const params = new URLSearchParams({ limit: '20' })

      if (category) {
        params.set('category', category)
      }

      const response = await api.get(`/products?${params}`)

      products.value = response.items.map((product) => ({
        ...product,
        category: product.categories,
      }))
    } catch (err) {
      error.value = err.message || 'No se pudieron cargar los productos.'
      console.error('Error al cargar catálogo:', err)
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="container section">
    <h1>Catálogo</h1>

    <p v-if="loading">Cargando productos...</p>

    <p v-else-if="error">{{ error }}</p>

    <div v-else-if="products.length" class="grid-products">
      <ProductCard
        v-for="product in products"
        :key="product.slug"
        :product="product"
      />
    </div>

    <p v-else>No hay productos disponibles.</p>
  </div>
</template>
