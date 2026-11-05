import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { api } from '@/services/api'

export const useCartStore = defineStore('cart', () => {
  // Estado inicial: recupera del localStorage si existe, sino empieza vacío
  const savedCart = localStorage.getItem('full-tech-cart')
  const items = ref(savedCart ? JSON.parse(savedCart) : [])
  const isOpen = ref(false)

  // Bandera para saber si el usuario está autenticado y sincronizar con la BD
  const isSyncedWithBackend = ref(false)

  // Persistencia automática con LocalStorage y sincronización con la API si corresponde
  watch(
    items,
    async (newItems) => {
      localStorage.setItem('full-tech-cart', JSON.stringify(newItems))
      
      if (isSyncedWithBackend.value) {
        try {
          await api.put('/cart', { items: newItems })
        } catch (error) {
          console.error('Error al sincronizar el carrito con la BD:', error)
        }
      }
    },
    { deep: true }
  )

  // Getters (cantidad total y subtotal)
  const count = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const subtotal = computed(() => {
    return items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  })

  // Sincronización y fusión con el backend al iniciar sesión
  async function initCartSync() {
    try {
      isSyncedWithBackend.value = true
      const localItems = [...items.value]

      if (localItems.length > 0) {
        const response = await api.post('/cart/merge', { items: localItems })
        items.value = response.data
      } else {
        const response = await api.get('/cart')
        items.value = response.data
      }
    } catch (error) {
      console.error('Error al inicializar la sincronización del carrito:', error)
    }
  }

  function stopCartSync() {
    isSyncedWithBackend.value = false
  }

  // Acciones
  function addItem(product, qty = 1) {
    const existingIndex = items.value.findIndex(i => i.variantId === product.variantId)
    
    if (existingIndex > -1) {
      items.value[existingIndex].quantity += qty
    } else {
      items.value.push({ ...product, quantity: qty })
    }
  }

  function removeItem(variantId) {
    items.value = items.value.filter(i => i.variantId !== variantId)
  }

  function updateQuantity(variantId, qty) {
    const item = items.value.find(i => i.variantId === variantId)
    if (item && qty > 0) {
      item.quantity = qty
    }
  }

  function clearCart() {
    items.value = []
  }

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  return {
    items,
    isOpen,
    count,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    open,
    close,
    initCartSync,
    stopCartSync
  }
})