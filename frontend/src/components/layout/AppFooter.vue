<script setup>
import { RouterLink } from 'vue-router'

const year = new Date().getFullYear()

const shopLinks = [
  { label: 'Audio', category: 'audio' },
  { label: 'Iluminación', category: 'iluminacion' },
  { label: 'Video y Soportes', category: 'video-y-soportes' },
  { label: 'Starter Packs', category: 'starter-packs' },
]

const accountLinks = [
  { label: 'Ingresar', to: { name: 'login' } },
  { label: 'Crear cuenta', to: { name: 'register' } },
  { label: 'Mi cuenta y pedidos', to: { name: 'account' } },
]

// TODO: reemplazar "#" por los perfiles reales cuando existan
const socials = [
  { label: 'Instagram', href: '#', icon: 'instagram' },
  { label: 'YouTube', href: '#', icon: 'youtube' },
  { label: 'TikTok', href: '#', icon: 'tiktok' },
  { label: 'Twitch', href: '#', icon: 'twitch' },
]

const members = [
  'Stefano Aymar',
  'Santiago Capitani',
  'Gabriel Jauregui',
  'Rocío Lucero',
  'Gustavo Martinez',
  'Dolores Mendoza',
  'Delfina Mulinetti',
  'Andrea Vargas',
  'Hugo Zanatta',
]
</script>

<template>
  <footer class="app-footer">
    <div class="container app-footer__grid">
      <div class="app-footer__brand">
        <RouterLink :to="{ name: 'home' }" class="app-footer__logo" aria-label="FULL-TECH, inicio">
          FULL<span class="accent-cyan">-TECH</span>
        </RouterLink>
        <p>Equipamiento para creadores de contenido, streamers y podcasters.</p>
        <ul class="app-footer__socials">
          <li v-for="social in socials" :key="social.label">
            <a :href="social.href" class="app-footer__social" :aria-label="social.label">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <template v-if="social.icon === 'instagram'">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" />
                </template>
                <template v-else-if="social.icon === 'youtube'">
                  <rect x="2" y="5" width="20" height="14" rx="4" />
                  <path d="M10 9l5 3-5 3z" />
                </template>
                <template v-else-if="social.icon === 'tiktok'">
                  <path d="M14 3v11a4 4 0 1 1-4-4" />
                  <path d="M14 3c0 3 2 5 5 5" />
                </template>
                <template v-else>
                  <path d="M4 3h16v11l-5 5h-4l-3 3v-3H4z" />
                  <path d="M11 8v4M16 8v4" />
                </template>
              </svg>
            </a>
          </li>
        </ul>
      </div>

      <nav class="app-footer__column" aria-label="Tienda">
        <h2 class="app-footer__title">Tienda</h2>
        <ul>
          <li v-for="link in shopLinks" :key="link.category">
            <RouterLink :to="{ name: 'catalog', query: { category: link.category } }">
              {{ link.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>

      <nav class="app-footer__column" aria-label="Mi cuenta">
        <h2 class="app-footer__title">Mi cuenta</h2>
        <ul>
          <li v-for="link in accountLinks" :key="link.label">
            <RouterLink :to="link.to">{{ link.label }}</RouterLink>
          </li>
        </ul>
      </nav>

      <div class="app-footer__column">
        <h2 class="app-footer__title">El equipo</h2>
        <p class="app-footer__team">Ctrl C + Ctrl V = 404 Not Found</p>
        <p>Proyecto Integrador · Programación IV · UTN FRSR</p>
        <p class="app-footer__members">{{ members.join(' · ') }}</p>
      </div>
    </div>

    <div class="app-footer__bottom">
      <div class="container app-footer__bottom-row">
        <span>© {{ year }} FULL-TECH</span>
        <span>Pago simulado con fines educativos</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: var(--space-9);
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-sm);
}

.app-footer__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  padding-block: var(--space-7) var(--space-6);
}

.app-footer__brand,
.app-footer__column {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.app-footer__logo {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--text-2xl);
  letter-spacing: 0.04em;
  color: var(--color-text);
}

.app-footer__logo:hover {
  color: var(--color-text);
}

.app-footer__socials {
  display: flex;
  gap: var(--space-2);
}

.app-footer__social {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.app-footer__social:hover {
  color: var(--color-cyan);
  border-color: var(--color-cyan);
  box-shadow: var(--glow-cyan);
}

.app-footer__title {
  font-family: var(--font-body);
  font-size: var(--text-base);
  letter-spacing: 0;
  color: var(--color-text);
}

.app-footer__column ul {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.app-footer__column a {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  color: var(--color-text-muted);
}

.app-footer__column a:hover {
  color: var(--color-cyan);
}

.app-footer__team {
  color: var(--color-cyan);
  font-weight: var(--font-semibold);
}

.app-footer__members {
  font-size: var(--text-xs);
  line-height: 1.7;
}

.app-footer__bottom {
  border-top: 1px solid var(--color-border);
}

.app-footer__bottom-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-2);
  padding-block: var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

@media (min-width: 768px) {
  .app-footer__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .app-footer__grid {
    grid-template-columns: 1.3fr 1fr 1fr 1.4fr;
    gap: var(--space-7);
  }
}
</style>
