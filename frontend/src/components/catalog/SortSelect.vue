<script setup>
// v-model: '' (orden por defecto) | 'newest' | 'price_asc' | 'price_desc'
defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const OPTIONS = [
  { value: '', label: 'Orden por defecto' },
  { value: 'newest', label: 'Más nuevos' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
]
</script>

<template>
  <label class="sort">
    <span class="sort__label">Ordenar por</span>
    <select :value="modelValue" @change="emit('update:modelValue', $event.target.value)">
      <option v-for="o in OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </label>
</template>

<style scoped>
.sort { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); }
.sort__label { color: var(--color-text-muted); }
select {
  min-height: 44px;
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font: inherit;
}
select:focus-visible {
  outline: none;
  border-color: var(--color-cyan);
  box-shadow: var(--glow-cyan);
}
</style>
