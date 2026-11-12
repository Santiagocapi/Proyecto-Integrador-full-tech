<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  variants: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['change'])
const selectedVariantId = ref(null)

watch(() => props.variants, (newVariants) => {
  if (newVariants && newVariants.length > 0) {
    const firstAvailable = newVariants.find(v => v.stock > 0) || newVariants[0]
    selectedVariantId.value = firstAvailable.id
    emit('change', firstAvailable)
  }
}, { immediate: true })

const selectVariant = (variant) => {
  if (variant.stock <= 0) return

  selectedVariantId.value = variant.id
  emit('change', variant)
}
</script>

<template>
  <div class="variant-selector">
    <label class="variant-label">Versión / Modelo</label>

    <div class="variant-options">
      <button
        v-for="variant in variants"
        :key="variant.id"
        type="button"
        @click="selectVariant(variant)"
        :disabled="variant.stock === 0"
        :class="[
          'variant-button',
          {
            'is-selected': selectedVariantId === variant.id,
            'is-unavailable': variant.stock === 0
          }
        ]"
      >
        <span>{{ variant.name }}</span>

        <span v-if="variant.stock === 0" class="variant-unavailable">
          Agotado
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.variant-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.variant-label {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.variant-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.variant-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 15px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.variant-button:hover:not(:disabled) {
  border-color: var(--color-cyan);
  color: var(--color-cyan);
}

.variant-button.is-selected {
  border-color: var(--color-cyan);
  background: rgba(0, 240, 255, 0.12);
  color: var(--color-cyan);
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.12);
}

.variant-button.is-unavailable {
  opacity: 0.4;
  text-decoration: line-through;
  cursor: not-allowed;
}

.variant-unavailable {
  color: var(--color-error);
  font-size: 0.65rem;
  text-decoration: none;
  text-transform: uppercase;
}
</style>