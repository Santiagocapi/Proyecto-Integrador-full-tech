<script setup>
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

// El carrito desplegable y los toasts (Dolo) se suman acá cuando existan,
// así están disponibles en todas las páginas.
</script>

<template>
  <div class="app-shell">
    <a href="#contenido" class="skip-link">Saltar al contenido</a>

    <AppHeader />

    <main id="contenido" class="app-shell__main" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Empuja el footer al fondo aunque la página tenga poco contenido */
.app-shell__main {
  flex: 1;
  outline: none;
}

/* Link oculto que aparece al navegar con Tab, para saltear el header */
.skip-link {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  z-index: var(--z-toast);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  background-color: var(--color-cyan);
  color: var(--color-text-on-accent);
  font-weight: var(--font-bold);
  transform: translateY(-200%);
}

.skip-link:focus {
  transform: translateY(0);
}

/* Transición suave entre vistas */
.page-enter-active,
.page-leave-active {
  transition:
    opacity var(--transition-base),
    transform var(--transition-base);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
}
</style>
