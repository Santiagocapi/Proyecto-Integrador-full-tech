<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'

const props = defineProps({
  modelValue: { type: Object, required: true }, // { category, minPrice, maxPrice, connection, compat[] }
  open: { type: Boolean, default: false }, // solo importa en móvil
})
const emit = defineEmits(['update:modelValue', 'close', 'clear'])

const CONNECTIONS = ['USB', 'USB-C', 'XLR', 'Lightning', 'Inalámbrico']
const COMPAT = ['PC', 'iPhone', 'Android']

const categories = ref([])
onMounted(async () => {
  try {
    categories.value = await api.get('/categories')
  } catch {
    categories.value = [] // el panel sigue funcionando sin categorías
  }
})

function update(patch) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

function toggleCompat(value) {
  const current = props.modelValue.compat || []
  update({
    compat: current.includes(value) ? current.filter((c) => c !== value) : [...current, value],
  })
}
</script>

<template>
  <div v-if="open" class="overlay" @click="emit('close')" />
  <aside class="panel" :class="{ open }" aria-label="Filtros">
    <header class="panel-head">
      <h2>Filtros</h2>
      <button class="close" type="button" aria-label="Cerrar filtros" @click="emit('close')">✕</button>
    </header>

    <fieldset>
      <legend>Categoría</legend>
      <label class="option">
        <input type="radio" name="category" :checked="!modelValue.category" @change="update({ category: '' })" />
        Todas
      </label>
      <label v-for="c in categories" :key="c.slug" class="option">
        <input
          type="radio"
          name="category"
          :checked="modelValue.category === c.slug"
          @change="update({ category: c.slug })"
        />
        {{ c.name }}
      </label>
    </fieldset>

    <fieldset>
      <legend>Precio</legend>
      <div class="price-row">
        <input
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="Mín."
          aria-label="Precio mínimo"
          :value="modelValue.minPrice"
          @change="update({ minPrice: $event.target.value })"
        />
        <input
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="Máx."
          aria-label="Precio máximo"
          :value="modelValue.maxPrice"
          @change="update({ maxPrice: $event.target.value })"
        />
      </div>
    </fieldset>

    <fieldset>
      <legend>Conexión</legend>
      <select :value="modelValue.connection" aria-label="Tipo de conexión" @change="update({ connection: $event.target.value })">
        <option value="">Todas</option>
        <option v-for="c in CONNECTIONS" :key="c" :value="c">{{ c }}</option>
      </select>
    </fieldset>

    <fieldset>
      <legend>Compatibilidad</legend>
      <label v-for="c in COMPAT" :key="c" class="option">
        <input type="checkbox" :checked="(modelValue.compat || []).includes(c)" @change="toggleCompat(c)" />
        {{ c }}
      </label>
    </fieldset>

    <button class="clear" type="button" @click="emit('clear')">Limpiar filtros</button>
  </aside>
</template>

<style scoped>
.panel {
  position: fixed;
  inset: 0 auto 0 0;
  width: min(320px, 88vw);
  padding: var(--space-4);
  overflow-y: auto;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transform: translateX(-100%);
  transition: transform 0.25s ease;
  z-index: calc(var(--z-drawer) + 1);
}
.panel.open { transform: none; }
.overlay { position: fixed; inset: 0; background: rgb(0 0 0 / 0.6); z-index: var(--z-drawer); }

.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.panel-head h2 { font-size: var(--text-xl); }
input[type='radio'], input[type='checkbox'] { accent-color: var(--color-cyan); }
.close { background: none; border: 0; color: inherit; font-size: 1.25rem; cursor: pointer; }

fieldset { border: 0; padding: 0; margin: 0 0 1.25rem; }
legend { font-weight: 600; margin-bottom: 0.5rem; }
.option { display: flex; gap: 0.5rem; align-items: center; padding: 0.25rem 0; cursor: pointer; }
.price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }

input[type='number'], select {
  width: 100%;
  padding: 0.5rem;
  color: inherit;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
input:focus-visible, select:focus-visible, button:focus-visible {
  outline: 2px solid var(--color-cyan);
  outline-offset: 2px;
}
.clear {
  width: 100%;
  padding: 0.6rem;
  color: var(--color-cyan);
  background: none;
  border: 1px solid var(--color-cyan);
  border-radius: var(--radius-md);
  cursor: pointer;
}

/* Desktop: el panel es una columna fija al costado, sin overlay */
@media (min-width: 1024px) {
  .panel {
    position: sticky;
    inset: auto;
    top: 5rem;
    width: auto;
    max-height: calc(100vh - 6rem);
    transform: none;
    border: 0;
    z-index: auto;
  }
  .overlay, .close { display: none; }
}
</style>
