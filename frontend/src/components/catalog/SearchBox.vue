<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'
import { formatPrice } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const wrapper = ref(null)
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const suggestions = ref([])
const open = ref(false)
const active = ref(-1) // índice de la sugerencia resaltada con el teclado

const MIN_CHARS = 2
const DEBOUNCE_MS = 300
const MAX_SUGGESTIONS = 5

let timer = null
let lastRequest = 0 // descarta respuestas viejas

function reset() {
  lastRequest++
  suggestions.value = []
  open.value = false
  active.value = -1
}

// Debounce: esperamos 300 ms sin escribir antes de pedir sugerencias
watch(query, (value) => {
  clearTimeout(timer)
  const term = value.trim()
  if (term.length < MIN_CHARS) return reset()
  timer = setTimeout(() => fetchSuggestions(term), DEBOUNCE_MS)
})

async function fetchSuggestions(term) {
  const id = ++lastRequest
  try {
    const data = await api.get(`/products?q=${encodeURIComponent(term)}&limit=${MAX_SUGGESTIONS}`)
    if (id !== lastRequest) return
    suggestions.value = data.items.slice(0, MAX_SUGGESTIONS)
    active.value = -1
    open.value = suggestions.value.length > 0
  } catch {
    // Las sugerencias son un extra: si fallan, el usuario igual puede apretar Enter
    if (id === lastRequest) reset()
  }
}

function submit() {
  const term = query.value.trim()
  if (!term) return
  clearTimeout(timer)
  reset()
  router.push({ name: 'catalog', query: { q: term } })
}

function goToProduct(product) {
  clearTimeout(timer)
  reset()
  query.value = ''
  router.push({ name: 'product', params: { slug: product.slug } })
}

function onKeydown(e) {
  if (e.key === 'ArrowDown' && suggestions.value.length) {
    e.preventDefault()
    open.value = true
    active.value = (active.value + 1) % suggestions.value.length
  } else if (e.key === 'ArrowUp' && suggestions.value.length) {
    e.preventDefault()
    active.value = (active.value - 1 + suggestions.value.length) % suggestions.value.length
  } else if (e.key === 'Escape') {
    open.value = false
    active.value = -1
  } else if (e.key === 'Enter' && open.value && active.value >= 0) {
    e.preventDefault()
    goToProduct(suggestions.value[active.value])
  }
}

// Cierra la lista cuando el foco sale del buscador
function onFocusout(e) {
  if (!wrapper.value?.contains(e.relatedTarget)) {
    open.value = false
    active.value = -1
  }
}

function finalPrice(p) {
  const offer = Number(p.offer_price)
  return offer > 0 && offer < Number(p.price) ? p.offer_price : p.price
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div ref="wrapper" class="search" @focusout="onFocusout">
    <form role="search" @submit.prevent="submit">
      <input
        v-model="query"
        type="search"
        placeholder="Buscar productos"
        aria-label="Buscar productos"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="search-suggestions"
        :aria-expanded="open"
        :aria-activedescendant="active >= 0 ? `search-option-${active}` : undefined"
        @keydown="onKeydown"
        @focus="open = suggestions.length > 0"
      />
    </form>

    <ul v-if="open" id="search-suggestions" class="suggestions" role="listbox" aria-label="Sugerencias">
      <li
        v-for="(p, i) in suggestions"
        :id="`search-option-${i}`"
        :key="p.slug"
        role="option"
        :aria-selected="i === active"
        :class="{ active: i === active }"
        @mousedown.prevent
        @click="goToProduct(p)"
        @mousemove="active = i"
      >
        <span class="name">{{ p.name }}</span>
        <span class="price">{{ formatPrice(finalPrice(p)) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search { position: relative; width: 100%; }

input {
  width: 100%;
  min-height: 44px;
  padding: var(--space-2) var(--space-4);
  color: var(--color-text);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font: inherit;
}
input:focus-visible {
  outline: none;
  border-color: var(--color-cyan);
  box-shadow: var(--glow-cyan);
}

.suggestions {
  position: absolute;
  top: calc(100% + var(--space-1));
  left: 0;
  right: 0;
  z-index: calc(var(--z-header) + 1);
  margin: 0;
  padding: var(--space-1);
  list-style: none;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}
.suggestions li {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.suggestions li.active { background: var(--color-surface-2); color: var(--color-cyan); }
.name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.price { flex-shrink: 0; color: var(--color-text-muted); font-size: var(--text-sm); }
</style>
