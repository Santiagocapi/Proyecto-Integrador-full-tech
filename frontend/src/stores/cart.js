import { defineStore } from 'pinia'

// TODO (Dolo): persistir en LocalStorage y sincronizar con la API manteniendo esta interfaz.
// Aca va la store del carrito de compras, que maneja el estado de los items en el carrito y si está abierto o cerrado. Se puede usar para agregar, actualizar, eliminar y limpiar items, así como para abrir y cerrar el carrito.
export const useCartStore = defineStore('cart', {
  state: () => ({ items: [], isOpen: false }),
  getters: {
    count: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
    subtotal: (state) => state.items.reduce((total, item) => total + item.price * item.quantity, 0),
  },
  actions: {
    addItem(item, qty = 1) {
      const existing = this.items.find((i) => i.variantId === item.variantId)
      if (existing) existing.quantity += qty
      else this.items.push({ ...item, quantity: qty })
    },
    updateQuantity(variantId, qty) {
      const item = this.items.find((i) => i.variantId === variantId)
      if (item) item.quantity = qty
    },
    removeItem(variantId) {
      this.items = this.items.filter((i) => i.variantId !== variantId)
    },
    clear() {
      this.items = []
    },
    open() {
      this.isOpen = true
    },
    close() {
      this.isOpen = false
    },
  },
})