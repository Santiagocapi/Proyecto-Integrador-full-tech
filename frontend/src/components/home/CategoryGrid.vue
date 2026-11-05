<script setup>
import { RouterLink } from 'vue-router'

// Los slugs tienen que coincidir con los de la tabla categories (seed de Gabriel)
// y con los links del header y el footer.
const categories = [
  {
    slug: 'audio',
    name: 'Audio',
    description: 'Micrófonos y brazos',
    color: 'cyan',
    icon: 'mic',
  },
  {
    slug: 'iluminacion',
    name: 'Iluminación',
    description: 'Aros, paneles y tiras LED',
    color: 'magenta',
    icon: 'light',
  },
  {
    slug: 'video-y-soportes',
    name: 'Video y Soportes',
    description: 'Gimbals y trípodes',
    color: 'violet',
    icon: 'video',
  },
  {
    slug: 'starter-packs',
    name: 'Starter Packs',
    description: 'Kits listos para grabar',
    color: 'cyan',
    icon: 'kit',
  },
]
</script>

<template>
  <section class="container" aria-labelledby="categories-title">
    <div class="section-header">
      <h2 id="categories-title" class="section-title">
        <span class="accent-cyan">Explorá</span> por categoría
      </h2>
    </div>

    <ul class="category-grid">
      <li v-for="category in categories" :key="category.slug">
        <RouterLink
          :to="{ name: 'catalog', query: { category: category.slug } }"
          class="category-card"
          :class="`category-card--${category.color}`"
        >
          <span class="category-card__icon" aria-hidden="true">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <template v-if="category.icon === 'mic'">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <path d="M12 17v4" />
                <path d="M8 21h8" />
              </template>
              <template v-else-if="category.icon === 'light'">
                <circle cx="12" cy="10" r="7" />
                <circle cx="12" cy="10" r="4" />
                <path d="M12 17v5" />
                <path d="M8 22h8" />
              </template>
              <template v-else-if="category.icon === 'video'">
                <rect x="2" y="6" width="14" height="12" rx="2" />
                <path d="M16 10l6-3v10l-6-3z" />
              </template>
              <template v-else>
                <path d="M21 8l-9-5-9 5 9 5 9-5z" />
                <path d="M3 8v8l9 5 9-5V8" />
                <path d="M12 13v8" />
              </template>
            </svg>
          </span>
          <span class="category-card__text">
            <strong class="category-card__name">{{ category.name }}</strong>
            <span class="category-card__description">{{ category.description }}</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* 2 columnas en celular, 4 en desktop */
.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

@media (min-width: 1024px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-5);
  }
}

.category-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-3);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  color: var(--color-text);
  text-align: center;
  transition:
    box-shadow var(--transition-base),
    border-color var(--transition-base),
    transform var(--transition-base);
}

.category-card:hover {
  color: var(--color-text);
  border-color: var(--color-magenta);
  box-shadow: var(--glow-magenta);
  transform: translateY(-2px);
}

.category-card__icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-surface-2);
  border-radius: var(--radius-lg);
}

.category-card--cyan .category-card__icon {
  color: var(--color-cyan);
}

.category-card--magenta .category-card__icon {
  color: var(--color-magenta);
}

.category-card--violet .category-card__icon {
  color: var(--color-violet-text);
}

.category-card__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.category-card__name {
  font-size: var(--text-base);
}

.category-card__description {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

@media (min-width: 768px) {
  .category-card {
    padding: var(--space-6) var(--space-5);
  }

  .category-card__icon {
    width: 84px;
    height: 84px;
  }

  .category-card__name {
    font-size: var(--text-lg);
  }
}
</style>
