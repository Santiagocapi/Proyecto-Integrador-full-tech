<script setup>
import ProductCard from '@/components/product/ProductCard.vue'

// Datos de ejemplo, solo para ver las tarjetas. No se commitea.
const products = [
  {
    name: 'Kit Mi Primer Stream',
    slug: 'kit-mi-primer-stream',
    price: 174999,
    offer_price: 149999,
    images: [],
    is_bundle: true,
    category: { name: 'Starter Packs' },
  },
  {
    name: 'Micrófono de condensador USB con filtro antipop',
    slug: 'microfono-condensador-usb',
    price: 104999,
    offer_price: 89999,
    images: [],
    is_bundle: false,
    category: { name: 'Audio' },
  },
  {
    name: 'Aro de luz LED 18" con trípode',
    slug: 'aro-de-luz-led-18',
    price: 74999,
    offer_price: null,
    images: [],
    is_bundle: false,
    category: { name: 'Iluminación' },
  },
  {
    name: 'Gimbal estabilizador para celular',
    slug: 'gimbal-estabilizador',
    price: 119999,
    offer_price: null,
    images: [],
    is_bundle: false,
    category: { name: 'Video y Soportes' },
  },
]
</script>

<template>
  <main class="container section">
    <div class="grid-products">
      <ProductCard v-for="product in products" :key="product.slug" :product="product" />
    </div>
  </main>
</template>
