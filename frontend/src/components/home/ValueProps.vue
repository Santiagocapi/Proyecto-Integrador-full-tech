<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// Los tres pilares del brief
const pillars = [
  {
    title: 'Curaduría especializada',
    text: 'Elegimos cada equipo pensando en creadores: nada de catálogos infinitos.',
    color: 'cyan',
    icon: 'star',
  },
  {
    title: 'Kits Plug & Play',
    text: 'Combos probados y compatibles entre sí, listos para conectar y grabar.',
    color: 'magenta',
    icon: 'kit',
  },
  {
    title: 'Identidad visual',
    text: 'Luces y accesorios para que tu set tenga estética propia en cámara.',
    color: 'violet',
    icon: 'spark',
  },
]
</script>

<template>
  <section class="container value-props" aria-labelledby="values-title">
    <h2 id="values-title" class="sr-only">Por qué elegir FULL-TECH</h2>

    <ul class="pillars">
      <li v-for="pillar in pillars" :key="pillar.title" class="pillar">
        <span class="pillar__icon" :class="`pillar__icon--${pillar.color}`" aria-hidden="true">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              v-if="pillar.icon === 'star'"
              d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"
            />
            <template v-else-if="pillar.icon === 'kit'">
              <path d="M21 8l-9-5-9 5 9 5 9-5z" />
              <path d="M3 8v8l9 5 9-5V8" />
              <path d="M12 13v8" />
            </template>
            <template v-else>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <path d="M5 5l2.5 2.5M16.5 16.5L19 19M5 19l2.5-2.5M16.5 7.5L19 5" />
            </template>
          </svg>
        </span>
        <div class="pillar__text">
          <h3 class="pillar__title">{{ pillar.title }}</h3>
          <p class="pillar__description">{{ pillar.text }}</p>
        </div>
      </li>
    </ul>

    <!-- Llamado a crear cuenta: solo para quien todavía no ingresó -->
    <div v-if="!auth.isLoggedIn" class="cta">
      <div class="cta__text">
        <h2 class="cta__title">Creá tu cuenta y armá tu setup</h2>
        <p>
          Tu carrito queda guardado en cualquier dispositivo y seguís tus pedidos desde Mi Cuenta.
        </p>
      </div>
      <div class="cta__actions">
        <BaseButton :to="{ name: 'register' }" size="lg">Crear cuenta</BaseButton>
        <BaseButton :to="{ name: 'login' }" variant="ghost" size="lg">Ya tengo cuenta</BaseButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.value-props {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
}

/* ---------- Pilares ---------- */
.pillars {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  padding: var(--space-5);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}

@media (min-width: 768px) {
  .pillars {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pillar {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.pillar__icon {
  flex: none;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid currentColor;
  border-radius: var(--radius-md);
}

.pillar__icon--cyan {
  color: var(--color-cyan);
}

.pillar__icon--magenta {
  color: var(--color-magenta);
}

.pillar__icon--violet {
  color: var(--color-violet-text);
}

.pillar__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.pillar__title {
  font-family: var(--font-body);
  font-size: var(--text-base);
  letter-spacing: 0;
}

.pillar__description {
  font-size: var(--text-sm);
}

/* ---------- CTA de registro ---------- */
.cta {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6) var(--space-5);
  background-color: var(--color-surface);
  border: 1px solid var(--color-violet);
  border-radius: var(--radius-2xl);
  box-shadow: var(--glow-violet-soft);
}

/* Líneas de neón arriba (cyan) y abajo (magenta) */
.cta::before,
.cta::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
}

.cta::before {
  top: 0;
  background-color: var(--color-cyan);
  box-shadow: 0 0 14px var(--color-cyan);
}

.cta::after {
  bottom: 0;
  background-color: var(--color-magenta);
  box-shadow: 0 0 14px var(--color-magenta);
}

.cta__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cta__title {
  font-size: var(--text-2xl);
}

.cta__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.cta__actions > * {
  flex: 1 1 100%;
}

@media (min-width: 768px) {
  .cta__actions > * {
    flex: 0 0 auto;
  }
}

@media (min-width: 1024px) {
  .cta {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-7) var(--space-8);
  }

  .cta__title {
    font-size: var(--text-3xl);
  }

  /* Los botones quedan en una fila a la derecha del texto */
  .cta__actions {
    flex: none;
  }
}
</style>
