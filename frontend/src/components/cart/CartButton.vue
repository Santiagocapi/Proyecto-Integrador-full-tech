<script setup>
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
</script>

<template>
  <button type="button" aria-label="Abrir carrito" @click="cart.open()">
    Carrito ({{ cart.count }})
  </button>
</template>