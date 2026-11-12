<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import { formatPrice } from '@/utils/format'

const stats = ref(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    stats.value = await api.get('/admin/stats', { auth: true })
  } catch (e) {
    error.value = e.message || 'No se pudieron cargar las métricas.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="adm-page">
    <header class="adm-head">
      <h1 class="adm-title">Resumen</h1>
    </header>

    <p v-if="loading" class="adm-state" role="status">Cargando métricas…</p>

    <div v-else-if="error" class="adm-state adm-state--error" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="adm-btn" @click="load">Reintentar</button>
    </div>

    <template v-else-if="stats">
      <div class="metrics">
        <article class="adm-card">
          <h2 class="metric__label">Pedidos</h2>
          <p class="metric__value">{{ stats.totalOrders }}</p>
        </article>
        <article class="adm-card">
          <h2 class="metric__label">Ventas totales</h2>
          <p class="metric__value">{{ formatPrice(stats.totalSales) }}</p>
          <p class="metric__hint">No incluye pedidos cancelados</p>
        </article>
        <article class="adm-card">
          <h2 class="metric__label">Variantes con poco stock</h2>
          <p class="metric__value">{{ stats.lowStock.length }}</p>
          <p class="metric__hint">{{ stats.lowStockThreshold }} unidades o menos</p>
        </article>
      </div>

      <div v-if="stats.lowStock.length" class="adm-alert low" role="alert">
        Hay {{ stats.lowStock.length }}
        {{ stats.lowStock.length === 1 ? 'variante' : 'variantes' }} con
        {{ stats.lowStockThreshold }} unidades o menos. Reponé el stock para no perder ventas.
      </div>

      <section v-if="stats.lowStock.length" class="adm-card">
        <h2 class="section-title">Productos con poco stock</h2>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Variante</th>
                <th scope="col">SKU</th>
                <th scope="col">Stock</th>
                <th scope="col"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in stats.lowStock" :key="row.variantId">
                <td data-label="Producto">{{ row.productName }}</td>
                <td data-label="Variante">{{ row.variantName }}</td>
                <td data-label="SKU">{{ row.sku }}</td>
                <td data-label="Stock">
                  <span class="adm-tag" :class="row.stock === 0 ? 'adm-tag--danger' : 'adm-tag--warn'">
                    {{ row.stock === 0 ? 'Sin stock' : row.stock }}
                  </span>
                </td>
                <td data-label="Acciones">
                  <RouterLink class="adm-btn" :to="`/admin/productos/${row.productId}`">
                    Editar producto
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p v-else class="adm-state">Todo el stock está por encima del mínimo.</p>
    </template>
  </section>
</template>

<style scoped>
.metrics {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric__label {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--adm-muted);
}

.metric__value {
  margin: 0.25rem 0 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--adm-cyan);
}

.metric__hint {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--adm-muted);
}

.low {
  margin-bottom: 1rem;
}

.section-title {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (min-width: 768px) {
  .metrics {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
