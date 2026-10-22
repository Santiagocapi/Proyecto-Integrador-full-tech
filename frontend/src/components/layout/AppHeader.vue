<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import SearchBox from '@/components/catalog/SearchBox.vue'
import CartButton from '@/components/cart/CartButton.vue'
import UserMenu from '@/components/auth/UserMenu.vue'

// Los slugs tienen que coincidir con los de la tabla categories del seed (Gabriel)
const links = [
  { label: 'Inicio', to: { name: 'home' } },
  { label: 'Catálogo', to: { name: 'catalog' } },
  { label: 'Audio', to: { name: 'catalog', query: { category: 'audio' } } },
  { label: 'Iluminación', to: { name: 'catalog', query: { category: 'iluminacion' } } },
  { label: 'Video y Soportes', to: { name: 'catalog', query: { category: 'video-y-soportes' } } },
  {
    label: 'Starter Packs',
    to: { name: 'catalog', query: { category: 'starter-packs' } },
    highlight: true,
  },
]

const route = useRoute()
const menuOpen = ref(false)

// Vue Router no mira el query para marcar el link activo, así que se compara a mano
function isActive(link) {
  const category = link.to.query?.category ?? null
  return route.name === link.to.name && (route.query.category ?? null) === category
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function onKeydown(event) {
  if (event.key === 'Escape') menuOpen.value = false
}

// Al navegar, el menú móvil se cierra solo
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header class="app-header">
    <p class="app-header__announcement">Starter Packs: todo compatible, en una sola compra</p>

    <div class="container app-header__main">
      <button
        type="button"
        class="app-header__menu-button"
        :aria-expanded="menuOpen"
        aria-controls="app-header-nav"
        :aria-label="menuOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="toggleMenu"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path v-if="menuOpen" d="M6 6l12 12M18 6L6 18" />
          <path v-else d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <RouterLink :to="{ name: 'home' }" class="app-header__logo" aria-label="FULL-TECH, inicio">
        FULL<span class="accent-cyan">-TECH</span>
      </RouterLink>

      <div class="app-header__search">
        <SearchBox />
      </div>

      <div class="app-header__actions">
        <UserMenu />
        <CartButton />
      </div>
    </div>

    <nav
      id="app-header-nav"
      class="app-header__nav"
      :class="{ 'app-header__nav--open': menuOpen }"
      aria-label="Principal"
    >
      <ul class="container app-header__links">
        <li v-for="link in links" :key="link.label">
          <RouterLink
            :to="link.to"
            class="app-header__link"
            :class="{
              'app-header__link--active': isActive(link),
              'app-header__link--highlight': link.highlight,
            }"
            :aria-current="isActive(link) ? 'page' : undefined"
          >
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.app-header__announcement {
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-xs);
  text-align: center;
}

/* Celular: menú + logo + acciones arriba, buscador abajo a todo el ancho */
.app-header__main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-4);
  padding-block: var(--space-3);
}

.app-header__menu-button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
}

.app-header__logo {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--text-xl);
  letter-spacing: 0.04em;
  color: var(--color-text);
  text-shadow: 0 0 18px rgba(0, 240, 255, 0.35);
}

.app-header__logo:hover {
  color: var(--color-text);
}

.app-header__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.app-header__search {
  order: 1;
  flex: 1 1 100%;
  min-width: 0;
}

/* Navegación: en celular se despliega con el botón de menú */
.app-header__nav {
  display: none;
  border-top: 1px solid var(--color-border);
}

.app-header__nav--open {
  display: block;
}

.app-header__links {
  display: flex;
  flex-direction: column;
  padding-block: var(--space-2);
}

.app-header__link {
  display: flex;
  align-items: center;
  min-height: 44px;
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  white-space: nowrap;
}

.app-header__link:hover {
  color: var(--color-cyan);
}

.app-header__link--highlight {
  color: var(--color-magenta);
}

.app-header__link--active {
  color: var(--color-cyan);
}

/* Desktop: todo en una fila y la navegación siempre visible */
@media (min-width: 1024px) {
  .app-header__main {
    flex-wrap: nowrap;
    gap: var(--space-6);
    padding-block: var(--space-4);
  }

  .app-header__menu-button {
    display: none;
  }

  .app-header__logo {
    font-size: var(--text-2xl);
  }

  .app-header__search {
    order: 0;
    flex: 1 1 auto;
  }

  .app-header__actions {
    margin-left: 0;
  }

  .app-header__nav {
    display: block;
  }

  .app-header__links {
    flex-direction: row;
    gap: var(--space-6);
    padding-block: 0;
  }
}
</style>
