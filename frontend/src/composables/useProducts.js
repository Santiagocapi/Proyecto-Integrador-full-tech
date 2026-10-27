import { ref, watch, toValue } from 'vue'
import { api } from '@/services/api'

/**
 * Trae productos de GET /api/products según filtros reactivos.
 * filters: ref/computed/getter con { q, category, minPrice, maxPrice,
 *          connection, compat, sort, page }
 * Si page > 1 agrega los resultados a los ya cargados ("Cargar más").
 */
export function useProducts(filters, { limit = 12 } = {}) {
  const products = ref([])
  const total = ref(0)
  const pages = ref(1)
  const loading = ref(false)
  const error = ref(null)

  let lastRequest = 0 // evita que una respuesta vieja pise a una más nueva

  function buildQuery(f) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(f)) {
      if (value === '' || value == null) continue
      if (Array.isArray(value)) {
        if (value.length) params.set(key, value.join(','))
      } else {
        params.set(key, value)
      }
    }
    params.set('limit', limit)
    return params.toString()
  }

  async function fetchProducts() {
    const id = ++lastRequest
    const f = toValue(filters)
    loading.value = true
    error.value = null
    try {
      const data = await api.get(`/products?${buildQuery(f)}`)
      if (id !== lastRequest) return
      products.value = f.page > 1 ? [...products.value, ...data.items] : data.items
      total.value = data.total
      pages.value = data.pages
    } catch (e) {
      if (id !== lastRequest) return
      error.value = e.message || 'No pudimos cargar los productos.'
    } finally {
      if (id === lastRequest) loading.value = false
    }
  }

  // Serializamos para que el watch dispare solo cuando cambia el contenido
  watch(() => JSON.stringify(toValue(filters)), fetchProducts, { immediate: true })

  return { products, total, pages, loading, error, refetch: fetchProducts }
}
