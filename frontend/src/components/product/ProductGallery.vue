<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  images: {
    type: Array,
    required: true,
    default: () => []
  },
  altName: {
    type: String,
    default: 'Producto FULL-TECH'
  }
})

const activeImage = ref(props.images[0] || '')

watch(() => props.images, (newImages) => {
  activeImage.value = newImages?.[0] || ''
}, { immediate: true })
</script>

<template>
  <div class="product-gallery-layout">

    <div
      v-if="images && images.length > 1"
      class="product-gallery__thumbs"
    >
      <button
        v-for="(img, idx) in images"
        :key="idx"
        type="button"
        @click="activeImage = img"
        :class="[
          'product-gallery__thumb',
          { 'is-active': activeImage === img }
        ]"
        :aria-label="`Ver imagen ${idx + 1}`"
      >
        <img
          :src="img"
          :alt="`${altName} miniatura ${idx + 1}`"
        />
      </button>
    </div>

    <div class="product-gallery__main">
      <img
        v-if="activeImage"
        :src="activeImage"
        :alt="altName"
        class="product-gallery__image"
      />

      <div v-else class="product-gallery__empty">
        Imagen no disponible
      </div>
    </div>

  </div>
</template>

<style scoped>
.product-gallery-layout {
  display: flex;
  flex-direction: column-reverse;
  gap: 14px;
  min-width: 0;
}

.product-gallery__thumbs {
  display: flex;
  flex-direction: row;
  gap: 12px;
  overflow-x: auto;
  padding: 3px 3px 8px;
}

.product-gallery__thumb {
  flex: 0 0 72px;
  width: 72px;
  height: 72px;
  padding: 5px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  opacity: 0.65;
  cursor: pointer;
  transition: all 0.2s ease;
}

.product-gallery__thumb:hover {
  opacity: 1;
  border-color: var(--color-text-muted);
}

.product-gallery__thumb.is-active {
  border: 2px solid var(--color-cyan);
  opacity: 1;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.25);
}

.product-gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.product-gallery__main {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-height: 480px;
  aspect-ratio: 1 / 1;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background:
    radial-gradient(circle at center, rgba(138, 43, 226, 0.09), transparent 65%),
    var(--color-surface);
  box-shadow: var(--shadow-card);
}

.product-gallery__image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  padding: 22px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.product-gallery__image:hover {
  transform: scale(1.035);
}

.product-gallery__empty {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

@media (min-width: 768px) {
  .product-gallery-layout {
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
  }

  .product-gallery__thumbs {
    flex-direction: column;
    max-height: 540px;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 3px 6px 3px 3px;
  }

  .product-gallery__thumb {
    flex-basis: 76px;
    width: 76px;
    height: 76px;
  }

  .product-gallery__main {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .product-gallery__image {
    padding: 14px;
  }
}
</style>