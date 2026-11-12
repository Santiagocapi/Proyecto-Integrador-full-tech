<script setup>
import { ref, watch, onMounted } from 'vue'
import { api } from '@/services/api'
import { useToast } from '@/composables/useToast'
import { formatPrice, formatDate } from '@/utils/format'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const { success, error: toastError } = useToast()

const STATUSES = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']
const STATUS_LABELS = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}
const STATUS_TAGS = {
  pendiente: 'adm-tag--warn',
  pagado: 'adm-tag--cyan',
  enviado: 'adm-tag--violet',
  entregado: 'adm-tag--ok',
  cancelado: 'adm-tag--danger',
}
const PAYMENT_LABELS = { tarjeta: 'Tarjeta', transferencia: 'Transferencia', efectivo: 'Efectivo' }

const orders = ref([])
const statusFilter = ref('')
const loading = ref(true)
const loadError = ref('')
const expandedId = ref(null)
const updatingId = ref(null)
const pendingCancel = ref(null)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const query = statusFilter.value ? `?status=${statusFilter.value}` : ''
    const res = await api.get(`/admin/orders${query}`, { auth: true })
    orders.value = res.items
    expandedId.value = null
  } catch (e) {
    loadError.value = e.message || 'No se pudieron cargar los pedidos.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(statusFilter, load)

const customerName = (o) => o.profiles?.full_name || o.shipping_name || '—'
const toggle = (id) => (expandedId.value = expandedId.value === id ? null : id)

async function applyStatus(order, status) {
  updatingId.value = order.id
  try {
    await api.patch(`/admin/orders/${order.id}/status`, { status }, { auth: true })
    order.status = status
    success(status === 'cancelado' ? 'Pedido cancelado y stock devuelto.' : 'Estado actualizado.')
    // Con filtro activo, el pedido deja de pertenecer a la lista
    if (statusFilter.value && statusFilter.value !== status) {
      orders.value = orders.value.filter((o) => o.id !== order.id)
    }
  } catch (e) {
    toastError(e.message || 'No se pudo cambiar el estado.')
    await load()
  } finally {
    updatingId.value = null
  }
}

function onStatusChange(order, event) {
  const status = event.target.value
  if (status === order.status) return
  if (status === 'cancelado') {
    // El select vuelve al estado actual hasta que se confirme
    event.target.value = order.status
    pendingCancel.value = order
    return
  }
  applyStatus(order, status)
}

async function confirmCancel() {
  const order = pendingCancel.value
  pendingCancel.value = null
  if (order) await applyStatus(order, 'cancelado')
}
</script>

<template>
  <section class="adm-page">
    <header class="adm-head">
      <h1 class="adm-title">Pedidos</h1>
    </header>

    <label class="adm-label filter">
      Filtrar por estado
      <select v-model="statusFilter" class="adm-input">
        <option value="">Todos</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ STATUS_LABELS[s] }}</option>
      </select>
    </label>

    <p v-if="loading" class="adm-state" role="status">Cargando pedidos…</p>

    <div v-else-if="loadError" class="adm-state adm-state--error" role="alert">
      <p>{{ loadError }}</p>
      <button type="button" class="adm-btn" @click="load">Reintentar</button>
    </div>

    <p v-else-if="!orders.length" class="adm-state">
      {{ statusFilter ? 'No hay pedidos con ese estado.' : 'Todavía no hay pedidos.' }}
    </p>

    <div v-else class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th scope="col">Seguimiento</th>
            <th scope="col">Fecha</th>
            <th scope="col">Cliente</th>
            <th scope="col">Total</th>
            <th scope="col">Estado</th>
            <th scope="col">Detalle</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="o in orders" :key="o.id">
            <tr>
              <td data-label="Seguimiento"><strong>{{ o.tracking_code }}</strong></td>
              <td data-label="Fecha">{{ formatDate(o.created_at) }}</td>
              <td data-label="Cliente">{{ customerName(o) }}</td>
              <td data-label="Total">{{ formatPrice(o.total) }}</td>
              <td data-label="Estado">
                <span class="adm-tag" :class="STATUS_TAGS[o.status]">{{ STATUS_LABELS[o.status] }}</span>
                <select
                  class="adm-input status-select"
                  :aria-label="`Cambiar estado del pedido ${o.tracking_code}`"
                  :value="o.status"
                  :disabled="o.status === 'cancelado' || updatingId === o.id"
                  @change="onStatusChange(o, $event)"
                >
                  <option v-for="s in STATUSES" :key="s" :value="s">{{ STATUS_LABELS[s] }}</option>
                </select>
              </td>
              <td data-label="Detalle">
                <button
                  type="button"
                  class="adm-btn"
                  :aria-expanded="expandedId === o.id"
                  @click="toggle(o.id)"
                >
                  {{ expandedId === o.id ? 'Ocultar detalle' : 'Ver detalle' }}
                </button>
              </td>
            </tr>

            <tr v-if="expandedId === o.id" class="detail-row">
              <td colspan="6">
                <div class="detail">
                  <div>
                    <h2 class="detail__title">Envío</h2>
                    <p>{{ o.shipping_name }}</p>
                    <p>{{ o.shipping_address }}, {{ o.shipping_city }} ({{ o.shipping_zip }})</p>
                    <p>Teléfono: {{ o.shipping_phone }}</p>
                    <p>Pago: {{ PAYMENT_LABELS[o.payment_method] ?? o.payment_method }} (simulado)</p>
                  </div>
                  <div>
                    <h2 class="detail__title">Productos</h2>
                    <ul class="items">
                      <li v-for="item in o.order_items" :key="item.id">
                        {{ item.quantity }} × {{ item.product_name }}
                        <span v-if="item.variant_name && item.variant_name !== 'Único'">
                          ({{ item.variant_name }})
                        </span>
                        — {{ formatPrice(item.unit_price * item.quantity) }}
                      </li>
                    </ul>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <BaseModal :open="!!pendingCancel" title="Cancelar pedido" @close="pendingCancel = null">
      <p v-if="pendingCancel">
        Vas a cancelar el pedido {{ pendingCancel.tracking_code }}. Las unidades vuelven al stock y
        el pedido ya no podrá cambiar de estado.
      </p>
      <div class="modal-actions">
        <button type="button" class="adm-btn" @click="pendingCancel = null">Mantener pedido</button>
        <BaseButton @click="confirmCancel">Cancelar pedido</BaseButton>
      </div>
    </BaseModal>
  </section>
</template>

<style scoped>
.filter {
  max-width: 16rem;
  margin-bottom: 1rem;
}

.status-select {
  width: auto;
  margin-top: 0.5rem;
}

.detail-row td {
  background: var(--adm-surface-2);
}

.detail {
  display: grid;
  gap: 1rem;
}

.detail p {
  margin: 0 0 0.25rem;
}

.detail__title {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.items {
  margin: 0;
  padding-left: 1.125rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

@media (min-width: 768px) {
  .detail {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 767px) {
  .detail-row td {
    display: block;
  }
}
</style>
