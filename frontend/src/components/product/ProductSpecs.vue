<script setup>
import { ref } from 'vue'

defineProps({
  description: {
    type: String,
    default: ''
  },
  specs: {
    type: Object,
    default: () => ({})
  },
  compatibility: {
    type: Array,
    default: () => []
  }
})

const activeTab = ref('description')

const tabs = [
  { id: 'description', label: 'Descripción' },
  { id: 'specs', label: 'Ficha técnica' },
  { id: 'compatibility', label: 'Compatibilidad' }
]
</script>

<template>
  <section class="product-specs">

    <div class="specs-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        @click="activeTab = tab.id"
        :class="[
          'specs-tab',
          { 'is-active': activeTab === tab.id }
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'description'" class="specs-content">
      <h3>Sobre este producto</h3>
      <p>
        {{ description || 'Este producto no cuenta con una descripción detallada.' }}
      </p>
    </div>

    <div v-if="activeTab === 'specs'" class="specs-content">
      <h3>Características técnicas</h3>

      <p
        v-if="!specs || Object.keys(specs).length === 0"
        class="specs-empty"
      >
        No hay especificaciones técnicas registradas.
      </p>

      <dl v-else class="specs-list">
        <div
          v-for="(value, key) in specs"
          :key="key"
          class="specs-row"
        >
          <dt>{{ key }}</dt>
          <dd>{{ value }}</dd>
        </div>
      </dl>
    </div>

    <div v-if="activeTab === 'compatibility'" class="specs-content">
      <h3>Compatibilidad</h3>

      <p
        v-if="!compatibility || compatibility.length === 0"
        class="specs-empty"
      >
        Compatible con dispositivos estándar del mercado.
      </p>

      <div v-else class="compatibility-list">
        <span
          v-for="(item, idx) in compatibility"
          :key="idx"
          class="compatibility-item"
        >
          <span>✓</span>
          {{ item }}
        </span>
      </div>
    </div>

  </section>
</template>

<style scoped>
.product-specs {
  padding: 26px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.specs-tabs {
  display: flex;
  gap: 26px;
  overflow-x: auto;
  border-bottom: 1px solid var(--color-border);
}

.specs-tab {
  position: relative;
  flex-shrink: 0;
  padding: 0 0 16px;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.2s ease;
}

.specs-tab:hover {
  color: var(--color-text);
}

.specs-tab.is-active {
  color: var(--color-cyan);
}

.specs-tab.is-active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--color-cyan);
  box-shadow: var(--glow-cyan);
  content: '';
}

.specs-content {
  padding-top: 25px;
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.8;
}

.specs-content h3 {
  margin-bottom: 12px;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.specs-content p {
  white-space: pre-line;
}

.specs-empty {
  color: var(--color-text-muted);
}

.specs-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.specs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 15px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg);
}

.specs-row dt {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
}

.specs-row dd {
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  text-align: right;
  overflow-wrap: anywhere;
}

.compatibility-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.compatibility-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.82rem;
}

.compatibility-item span {
  color: var(--color-success);
  font-weight: 800;
}

@media (max-width: 600px) {
  .product-specs {
    padding: 18px;
  }

  .specs-tabs {
    gap: 18px;
  }

  .specs-list {
    grid-template-columns: 1fr;
  }
}
</style>