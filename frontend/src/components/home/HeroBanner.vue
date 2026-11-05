<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<template>
  <section class="container hero" aria-labelledby="hero-title">
    <div class="hero__box">
      <div class="hero__content">
        <span class="hero__eyebrow">Kits Plug &amp; Play</span>

        <h1 id="hero-title" class="hero__title">
          Tu set, listo para <span class="accent-cyan text-glow">salir en cámara</span>
        </h1>

        <p class="hero__text">
          Audio, luz y video elegidos para creadores. Armamos combos compatibles para que conectes y
          empieces a grabar, sin comprar nada que no funcione junto.
        </p>

        <div class="hero__actions">
          <BaseButton :to="{ name: 'catalog', query: { category: 'starter-packs' } }" size="lg">
            Ver Starter Packs
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </BaseButton>
          <BaseButton :to="{ name: 'catalog' }" variant="secondary" size="lg">
            Explorar catálogo
          </BaseButton>
        </div>
      </div>

      <!-- Dibujo decorativo: aro de luz con un celular en el centro -->
      <div class="hero__visual" aria-hidden="true">
        <div class="hero__halo"></div>
        <div class="hero__stand">
          <div class="hero__ring">
            <div class="hero__phone">
              <div class="hero__camera"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding-top: var(--space-5);
}

.hero__box {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6) var(--space-5);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
}

.hero__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.hero__eyebrow {
  align-self: flex-start;
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-magenta);
  border-radius: var(--radius-full);
  color: var(--color-magenta);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero__title {
  font-size: var(--text-3xl);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0.01em;
}

.hero__text {
  max-width: 520px;
  font-size: var(--text-base);
  line-height: 1.6;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

/* En celular los botones ocupan todo el ancho */
.hero__actions > * {
  flex: 1 1 100%;
}

/* ---------- Dibujo del aro de luz ---------- */
.hero__visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 260px;
}

.hero__halo {
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: var(--radius-full);
  background: radial-gradient(circle, rgba(138, 43, 226, 0.28) 0%, rgba(138, 43, 226, 0) 70%);
}

.hero__stand {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero__ring {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 12px solid var(--color-cyan);
  border-radius: var(--radius-full);
  box-shadow:
    0 0 30px rgba(0, 240, 255, 0.7),
    0 0 80px rgba(0, 240, 255, 0.35),
    inset 0 0 30px rgba(0, 240, 255, 0.5);
}

.hero__phone {
  width: 62px;
  height: 114px;
  display: flex;
  justify-content: center;
  padding-top: var(--space-2);
  background-color: var(--color-bg);
  border: 3px solid var(--color-text);
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 4px var(--color-surface-2);
}

.hero__camera {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background-color: var(--color-magenta);
  box-shadow: 0 0 10px var(--color-magenta);
}

.hero__pole {
  width: 6px;
  height: 48px;
  background-color: var(--color-border);
}

.hero__legs {
  display: flex;
  gap: 48px;
}

.hero__leg {
  width: 6px;
  height: 36px;
  background-color: var(--color-border);
  transform-origin: top;
}

.hero__leg--left {
  transform: rotate(28deg);
}

.hero__leg--right {
  transform: rotate(-28deg);
}

/* Tablet: más aire y botones en línea */
@media (min-width: 768px) {
  .hero__box {
    padding: var(--space-7) var(--space-6);
  }

  .hero__title {
    font-size: var(--text-4xl);
  }

  .hero__text {
    font-size: var(--text-lg);
  }

  .hero__actions > * {
    flex: 0 0 auto;
  }
}

/* Desktop: texto a la izquierda y aro de luz a la derecha */
@media (min-width: 1024px) {
  .hero__box {
    flex-direction: row;
    align-items: center;
    gap: var(--space-6);
    padding: var(--space-8) var(--space-8);
  }

  .hero__content {
    flex: 1 1 55%;
    gap: var(--space-5);
  }

  .hero__title {
    font-size: var(--text-5xl);
  }

  .hero__visual {
    flex: 1 1 45%;
    min-height: 380px;
  }

  .hero__halo {
    width: 380px;
    height: 380px;
  }

  .hero__ring {
    width: 300px;
    height: 300px;
    border-width: 18px;
  }

  .hero__phone {
    width: 92px;
    height: 170px;
    border-radius: var(--radius-lg);
  }

  .hero__camera {
    width: 10px;
    height: 10px;
  }
}
</style>
