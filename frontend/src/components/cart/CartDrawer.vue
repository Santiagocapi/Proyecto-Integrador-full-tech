<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
const router = useRouter()

const goToCheckout = () => {
  cartStore.close()
  router.push('/checkout')
}

// Cerrar el drawer al presionar la tecla Escape
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && cartStore.isOpen) {
    cartStore.close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div v-if="cartStore.isOpen" class="fixed inset-0 z-50 overflow-hidden">
    <!-- Fondo oscuro transparente -->
    <div 
      class="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
      @click="cartStore.close()"
    ></div>

    <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
      <div class="w-screen max-w-md bg-white shadow-xl flex flex-col">
        
        <!-- Header del Carrito -->
        <div class="flex items-center justify-between px-6 py-4 border-b">
          <h2 class="text-lg font-semibold text-gray-900">Tu Carrito de Compras</h2>
          <button 
            @click="cartStore.close()"
            class="text-gray-400 hover:text-gray-500 text-xl font-bold focus:outline-none"
            aria-label="Cerrar carrito"
          >
            &times;
          </button>
        </div>

        <!-- Lista de Productos -->
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div v-if="cartStore.items.length === 0" class="text-center text-gray-500 py-12">
            <p>Tu carrito está vacío.</p>
          </div>

          <div 
            v-for="item in cartStore.items" 
            :key="item.variantId"
            class="flex items-center justify-between border-b pb-4"
          >
            <div class="flex items-center space-x-4">
              <img :src="item.image" :alt="item.name" class="w-16 h-16 object-cover rounded" />
              <div>
                <h4 class="text-sm font-medium text-gray-900">{{ item.name }}</h4>
                <p class="text-xs text-gray-500">{{ item.variantName }}</p>
                <p class="text-sm font-semibold text-gray-900 mt-1">${{ item.price }}</p>
              </div>
            </div>

            <!-- Controles de cantidad y eliminar -->
            <div class="flex flex-col items-end space-y-2">
              <button 
                @click="cartStore.removeItem(item.variantId)"
                class="text-red-500 hover:text-red-700 text-xs font-medium"
              >
                Eliminar
              </button>
              
              <div class="flex items-center border rounded">
                <button 
                  @click="cartStore.updateQuantity(item.variantId, item.quantity - 1)"
                  class="px-2 py-0.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  :disabled="item.quantity <= 1"
                >-</button>
                <span class="px-3 text-sm">{{ item.quantity }}</span>
                <button 
                  @click="cartStore.updateQuantity(item.variantId, item.quantity + 1)"
                  class="px-2 py-0.5 text-gray-600 hover:bg-gray-100"
                >+</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer / Subtotal y Checkout -->
        <div class="border-t px-6 py-4 bg-gray-50">
          <div class="flex justify-between text-base font-medium text-gray-900 mb-4">
            <p>Subtotal</p>
            <p>${{ cartStore.subtotal.toFixed(2) }}</p>
          </div>
          
          <button 
            @click="goToCheckout"
            class="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="cartStore.items.length === 0"
          >
            Finalizar Compra
          </button>
        </div>

      </div>
    </div>
  </div>
</template>