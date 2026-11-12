<template>
  <div class="account-container">
    <div class="account-header">
      <h1>Mi Cuenta</h1>
      <p>Administrá tus datos personales de forma segura y consultá el historial de tus pedidos.</p>
    </div>

    <!-- Toast de notificación -->
    <div v-if="toast.show" :class="['toast', toast.type]">
      {{ toast.message }}
    </div>

    <div class="account-grid">
      <!-- Sección Formulario de Perfil -->
      <section class="profile-section card">
        <h2>Datos Personales</h2>
        <form @submit.prevent="handleUpdateProfile" class="profile-form">
          <div class="form-group">
            <label for="full_name">Nombre y Apellido</label>
            <input 
              type="text" 
              id="full_name" 
              v-model="form.full_name" 
              placeholder="Tu nombre completo"
              @blur="validateField('full_name', form.full_name, form)"
            />
            <span v-if="errors.full_name" class="error-text">{{ errors.full_name }}</span>
          </div>

          <div class="form-group">
            <label for="phone">Teléfono</label>
            <input 
              type="text" 
              id="phone" 
              v-model="form.phone" 
              placeholder="+54 9 ..."
              @blur="validateField('phone', form.phone, form)"
            />
            <span v-if="errors.phone" class="error-text">{{ errors.phone }}</span>
          </div>

          <div class="form-group">
            <label for="address">Dirección</label>
            <input 
              type="text" 
              id="address" 
              v-model="form.address" 
              placeholder="Calle y número"
              @blur="validateField('address', form.address, form)"
            />
            <span v-if="errors.address" class="error-text">{{ errors.address }}</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="city">Ciudad</label>
              <input 
                type="text" 
                id="city" 
                v-model="form.city"
                @blur="validateField('city', form.city, form)"
              />
              <span v-if="errors.city" class="error-text">{{ errors.city }}</span>
            </div>

            <div class="form-group">
              <label for="province">Provincia</label>
              <input 
                type="text" 
                id="province" 
                v-model="form.province"
                @blur="validateField('province', form.province, form)"
              />
              <span v-if="errors.province" class="error-text">{{ errors.province }}</span>
            </div>
          </div>

          <div class="form-group">
            <label for="zip">Código Postal</label>
            <input 
              type="text" 
              id="zip" 
              v-model="form.zip"
              @blur="validateField('zip', form.zip, form)"
            />
            <span v-if="errors.zip" class="error-text">{{ errors.zip }}</span>
          </div>

          <button type="submit" class="btn-save" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </form>
      </section>

      <!-- Sección Historial de Pedidos -->
      <section class="orders-section card">
        <h2>Historial de Pedidos</h2>
        <div v-if="loadingOrders" class="loading-text">Cargando tus pedidos...</div>
        <div v-else-if="orders.length === 0" class="empty-orders">
          <p>Aún no tenés pedidos registrados en FULL-TECH.</p>
        </div>
        <div v-else class="orders-list">
          <div v-for="order in orders" :key="order.id" class="order-card">
  <div class="order-info">
    <span class="order-date">
      📅 {{ formatDate(order.created_at) }}
    </span>

    <span class="order-tracking">
      Nº Seguimiento:
      <strong>{{ order.tracking_code || order.id }}</strong>
    </span>

    <span class="order-total">
      Total: {{ formatPrice(order.total) }}
    </span>
  </div>

  <div class="order-status"
       :class="order.status ? order.status.toLowerCase() : ''">
    {{ order.status }}
  </div>

  <button
    type="button"
    class="btn-details"
    @click="toggleOrder(order.id)"
  >
    {{ expandedOrderId === order.id ? 'Ocultar detalle' : 'Ver detalle' }}
  </button>

  <div
    v-if="expandedOrderId === order.id"
    class="order-details"
  >
    <h3>Detalle del pedido</h3>
    <p>Pedido Nº {{ order.tracking_code || order.id }}</p>
    <p>Fecha: {{ formatDate(order.created_at) }}</p>
    <p>Estado: {{ order.status }}</p>
    <p>Total: {{ formatPrice(order.total) }}</p>

    <ul v-if="order.items?.length" class="order-items">
      <li v-for="item in order.items" :key="item.variant_id">
        <span>{{ item.product_name }} · {{ item.variant_name }} × {{ item.quantity }}</span>
        <strong>{{ formatPrice(item.unit_price * item.quantity) }}</strong>
      </li>
    </ul>
  </div>
</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import { useFormValidation } from '@/composables/useFormValidation'
import { formatPrice } from '@/utils/format'

// Store de autenticación de Pinia
const auth = useAuthStore()

// Datos del formulario
const form = reactive({
  full_name: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  zip: '',
})

// Reglas de validación
const validationRules = {
  full_name: (value) =>
    value?.trim().length >= 2 ||
    'El nombre debe tener al menos 2 caracteres',

  phone: (value) =>
    !value?.trim() ||
    /^\+?[0-9\s()-]{6,15}$/.test(value.trim()) ||
    'El formato del teléfono no es válido',

  address: (value) =>
    value?.trim().length >= 3 ||
    'La dirección debe tener al menos 3 caracteres',

  city: (value) =>
    value?.trim().length >= 2 ||
    'La ciudad debe tener al menos 2 caracteres',

  province: (value) =>
    value?.trim().length >= 2 ||
    'La provincia debe tener al menos 2 caracteres',

  zip: (value) =>
    value?.trim().length >= 4 ||
    'El código postal debe tener al menos 4 caracteres',
}

// Composable de validación
const {
  errors,
  validate,
  validateField,
  setFieldError,
  clearErrors,
} = useFormValidation(validationRules)

// Estados de la pantalla
const loading = ref(false)
const loadingOrders = ref(true)
const orders = ref([])
const expandedOrderId = ref(null)

// Notificaciones
const toast = reactive({
  show: false,
  message: '',
  type: 'success',
})

const showToast = (message, type = 'success') => {
  toast.message = message
  toast.type = type
  toast.show = true

  setTimeout(() => {
    toast.show = false
  }, 3000)
}

// Cargar los datos del perfil desde Pinia
function loadProfile() {
  if (!auth.profile) return

  Object.assign(form, {
    full_name: auth.profile.full_name ?? '',
    phone: auth.profile.phone ?? '',
    address: auth.profile.address ?? '',
    city: auth.profile.city ?? '',
    province: auth.profile.province ?? '',
    zip: auth.profile.zip ?? '',
  })
}

// Observar cuándo llega o se actualiza el perfil
watch(
  () => auth.profile,
  () => {
    loadProfile()
    clearErrors()
  },
  { immediate: true }
)

// Actualizar los datos personales
async function handleUpdateProfile() {
  clearErrors()

  // Validar todos los campos
  if (!validate(form)) {
    showToast('Revisá los campos señalados', 'error')
    return
  }

  loading.value = true

  try {
    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      province: form.province.trim(),
      zip: form.zip.trim(),
    }

    // Enviar los datos al backend con autenticación
    const response = await api.put('/me', payload, {
      auth: true,
    })

    // Actualizar el perfil de Pinia
    auth.profile = response.profile

    loadProfile()

    showToast('¡Perfil actualizado con éxito!')
  } catch (error) {
    // Mostrar errores de validación que devuelve el backend
    if (Array.isArray(error.details)) {
      error.details.forEach((detail) => {
        setFieldError(detail.field, detail.message)
      })
    }

    showToast(
      error.message || 'No se pudieron guardar los cambios',
      'error'
    )
  } finally {
    loading.value = false
  }
}

// Cargar historial de pedidos
async function fetchOrders() {
  loadingOrders.value = true

  try {
    const response = await api.get('/me/orders', {
      auth: true,
    })

    orders.value = Array.isArray(response)
      ? response
      : response?.orders ?? []
  } catch (error) {
    orders.value = []

    showToast(
      error.message || 'No se pudo cargar el historial de pedidos',
      'error'
    )
  } finally {
    loadingOrders.value = false
  }
}

// Abrir o cerrar el detalle de un pedido
function toggleOrder(orderId) {
  expandedOrderId.value =
    expandedOrderId.value === orderId ? null : orderId
}

// Formatear fecha
function formatDate(dateString) {
  if (!dateString) return ''

  try {
    return new Date(dateString).toLocaleDateString('es-AR')
  } catch {
    return dateString
  }
}

// Cargar los pedidos al entrar en la pantalla
onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.account-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
  color: #fff;
}

.account-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #00F0FF; /* Estética neón FULL-TECH */
}

.account-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 1.5rem;
}

.card {
  background: #121212;
  border: 1px solid #222;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #bbb;
}

input {
  width: 100%;
  padding: 0.75rem;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
}

input:focus {
  border-color: #00F0FF;
  outline: none;
}

.error-text {
  color: #ff4d4d;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.btn-save {
  background: #00F0FF;
  color: #000;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
  transition: all 0.3s;
}

.btn-save:hover {
  background: #00b3bf;
}

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 4px;
  color: #000;
  font-weight: bold;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.toast.success {
  background: #00F0FF;
}

.toast.error {
  background: #ff4d4d;
  color: #fff;
}

.order-card {
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid #00F0FF;
}

.order-info span {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.order-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: bold;
  background: #333;
}

@media (max-width: 768px) {
  .account-grid {
    grid-template-columns: 1fr;
  }
}
.btn-details {
  background: transparent;
  color: #00F0FF;
  border: 1px solid #00F0FF;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-details:hover {
  background: #00F0FF;
  color: #000;
}

.order-details {
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  border-top: 1px solid #333;
  color: #bbb;
}

.order-items {
  list-style: none;
  margin: var(--space-3) 0 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.order-items li {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.order-details h3 {
  color: #00F0FF;
  margin-bottom: 0.75rem;
}
</style>