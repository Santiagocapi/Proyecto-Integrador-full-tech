<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import { useToast } from '@/composables/useToast'
import { formatPrice } from '@/utils/format'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const { success, error: toastError } = useToast()

const items = ref([])
const total = ref(0)
const page = ref(1)
const pages = ref(1)
const q = ref('')
const loading = ref(true)
const loadError = ref('')

// Borradores de la edición en línea: stock por variante y precio de oferta por producto
const stockDraft = reactive({})
const offerDraft = reactive({})
const saving = reactive({})

const toDeactivate = ref(null)
const deactivating = ref(false)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const params = new URLSearchParams({ page: String(page.value), limit: '10' })
    if (q.value.trim()) params.set('q', q.value.trim())
    const res = await api.get(`/products?${params}`, { auth: true })
    items.value = res.items
    total.value = res.total
    page.value = res.page
    pages.value = res.pages
    for (const p of res.items) {
      offerDraft[p.id] = p.offer_price ?? ''
      for (const v of p.variants ?? []) stockDraft[v.id] = v.stock
    }
  } catch (e) {
    loadError.value = e.message || 'No se pudieron cargar los productos.'
  } finally {
    loading.value = false
  }
}

// Búsqueda con debounce de 300 ms
let timer
watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})
onBeforeUnmount(() => clearTimeout(timer))
onMounted(load)

function goTo(n) {
  page.value = n
  load()
}

const stockDirty = (v) => Number(stockDraft[v.id]) !== v.stock
const offerValue = (p) => (offerDraft[p.id] === '' || offerDraft[p.id] == null ? null : Number(offerDraft[p.id]))
const offerDirty = (p) => offerValue(p) !== (p.offer_price ?? null)

async function saveStock(v) {
  const n = Number(stockDraft[v.id])
  if (!Number.isInteger(n) || n < 0) {
    toastError('El stock tiene que ser un número entero, 0 o mayor.')
    return
  }
  saving[`v${v.id}`] = true
  try {
    await api.patch(`/admin/variants/${v.id}`, { stock: n }, { auth: true })
    v.stock = n
    success('Stock actualizado.')
  } catch (e) {
    toastError(e.message || 'No se pudo actualizar el stock.')
  } finally {
    saving[`v${v.id}`] = false
  }
}

async function saveOffer(p) {
  const value = offerValue(p)
  if (value !== null && (Number.isNaN(value) || value < 0 || value >= Number(p.price))) {
    toastError('El precio de oferta tiene que ser menor al precio normal.')
    return
  }
  const firstVariant = p.variants?.[0]
  if (!firstVariant) {
    toastError('Este producto no tiene variantes.')
    return
  }
  saving[`o${p.id}`] = true
  try {
    await api.patch(`/admin/variants/${firstVariant.id}`, { offer_price: value }, { auth: true })
    p.offer_price = value
    success('Precio de oferta actualizado.')
  } catch (e) {
    toastError(e.message || 'No se pudo actualizar el precio de oferta.')
  } finally {
    saving[`o${p.id}`] = false
  }
}

async function confirmDeactivate() {
  const product = toDeactivate.value
  if (!product) return
  deactivating.value = true
  try {
    await api.delete(`/admin/products/${product.id}`, { auth: true })
    success('Producto dado de baja.')
    toDeactivate.value = null
    await load()
  } catch (e) {
    toastError(e.message || 'No se pudo dar de baja el producto.')
  } finally {
    deactivating.value = false
  }
}
</script>

<template>
  <section class="adm-page">
    <header class="adm-head">
      <h1 class="adm-title">Productos</h1>
      <RouterLink class="adm-btn" to="/admin/productos/nuevo">Crear producto</RouterLink>
    </header>

    <label class="adm-label search">
      Buscar producto
      <input v-model="q" class="adm-input" type="search" placeholder="Nombre o descripción" />
    </label>

    <p v-if="loading" class="adm-state" role="status">Cargando productos…</p>

    <div v-else-if="loadError" class="adm-state adm-state--error" role="alert">
      <p>{{ loadError }}</p>
      <button type="button" class="adm-btn" @click="load">Reintentar</button>
    </div>

    <p v-else-if="!items.length" class="adm-state">
      No hay productos que coincidan con la búsqueda.
    </p>

    <template v-else>
      <p class="count">{{ total }} {{ total === 1 ? 'producto' : 'productos' }}</p>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th scope="col">Imagen</th>
              <th scope="col">Nombre</th>
              <th scope="col">Categoría</th>
              <th scope="col">Precio</th>
              <th scope="col">Oferta</th>
              <th scope="col">Stock por variante</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in items" :key="p.id">
              <td data-label="Imagen">
                <img v-if="p.images?.length" class="thumb" :src="p.images[0]" :alt="p.name" loading="lazy" />
                <span v-else class="thumb thumb--empty">Sin foto</span>
              </td>
              <td data-label="Nombre">
                <strong>{{ p.name }}</strong>
                <div class="tags">
                  <span v-if="p.is_bundle" class="adm-tag adm-tag--violet">Kit</span>
                  <span v-if="!p.active" class="adm-tag adm-tag--danger">Dado de baja</span>
                </div>
              </td>
              <td data-label="Categoría">{{ p.categories?.name ?? '—' }}</td>
              <td data-label="Precio">{{ formatPrice(p.price) }}</td>
              <td data-label="Oferta">{{ p.offer_price ? formatPrice(p.offer_price) : "-" }}</td>
              <td data-label="Stock">
                <ul class="variants">
                  <li v-for="v in p.product_variants" :key="v.id" class="inline">
                    <span class="variant-name">{{ v.name }}:</span>
                    {{ v.stock }}
                  </li>
                </ul>
              </td>
              <td data-label="Acciones">
                <div class="actions">
                  <RouterLink class="adm-btn" :to="`/admin/productos/${p.id}/${p.slug}`">Editar</RouterLink>
                  <button
                    v-if="p.active"
                    type="button"
                    class="adm-btn adm-btn--danger"
                    @click="toDeactivate = p.active"
                  >
                    Dar de baja
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="pages > 1" class="pager" aria-label="Paginación">
        <button type="button" class="adm-btn" :disabled="page <= 1" @click="goTo(page - 1)">
          Anterior
        </button>
        <span>Página {{ page }} de {{ pages }}</span>
        <button type="button" class="adm-btn" :disabled="page >= pages" @click="goTo(page + 1)">
          Siguiente
        </button>
      </nav>
    </template>

    <BaseModal :open="!!toDeactivate" title="Dar de baja el producto" @close="toDeactivate = null">
      <p v-if="toDeactivate">
        «{{ toDeactivate.name }}» dejará de verse en la tienda. Los pedidos anteriores
        conservan su detalle y podés volver a activarlo desde la edición del producto.
      </p>
      <div class="modal-actions">
        <button type="button" class="adm-btn" @click="toDeactivate = null">Cancelar</button>
        <BaseButton :disabled="deactivating" @click="confirmDeactivate">
          {{ deactivating ? 'Dando de baja…' : 'Dar de baja' }}
        </BaseButton>
      </div>
    </BaseModal>
  </section>
</template>

<style scoped>
.search {
  max-width: 24rem;
  margin-bottom: 1rem;
}

.count {
  margin: 0 0 0.75rem;
  color: var(--adm-muted);
  font-size: 0.875rem;
}

.thumb {
  display: block;
  width: 3.5rem;
  height: 3.5rem;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid var(--adm-border);
}

.thumb--empty {
  display: grid;
  place-items: center;
  font-size: 0.6875rem;
  color: var(--adm-muted);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.375rem;
}

.inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.variants {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.variant-name {
  min-width: 4rem;
  color: var(--adm-muted);
  font-size: 0.875rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  color: var(--adm-muted);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style>
