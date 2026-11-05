<script setup>
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'

const cartStore = useCartStore()
const { count } = storeToRefs(cartStore)
</script>

<template>
  <button 
    @click="cartStore.toggle()"
    class="relative flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
    aria-label="Ver carrito de compras"
  >
    <!-- Icono de Carrito SVG -->
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    
    <span class="hidden md:inline font-medium">Carrito</span>

    <!-- Badge con la cantidad de productos -->
    <span 
      v-if="count > 0"
      class="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-bounce"
    >
      {{ count }}
    </span>
  </button>
</template>