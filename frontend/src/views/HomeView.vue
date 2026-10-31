
<script setup>
import { ref, onMounted } from 'vue'
import ProductCard from '@/components/product/ProductCard.vue'
import { api } from '@/services/api'

const products = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const response = await api.get('/products?limit=20')

    products.value = response.items.map((product) => ({
      ...product,
      category: product.categories,
    }))
  } catch (err) {
    error.value = err.message || 'No se pudieron cargar los productos.'
    console.error('Error al cargar productos:', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container section">
    <p v-if="loading">Cargando productos...</p>

    <p v-else-if="error">
      {{ error }}
    </p>

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
