<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="adm">
    <nav class="adm-nav" aria-label="Panel de administración">
      <p class="adm-nav__title">Panel de administración</p>
      <ul class="adm-nav__list">
        <li>
          <RouterLink to="/admin" active-class="" exact-active-class="is-active">
            Resumen
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/admin/productos" active-class="is-active">Productos</RouterLink>
        </li>
        <li>
          <RouterLink to="/admin/pedidos" active-class="is-active">Pedidos</RouterLink>
        </li>
        <li class="adm-nav__back">
          <RouterLink to="/">Volver a la tienda</RouterLink>
        </li>
      </ul>
    </nav>

    <main class="adm-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* Variables locales del panel. Los colores salen del sistema de diseño del plan
   (tokens.css); si el token existe se usa, si no queda el valor del plan. */
.adm {
  --adm-bg: #0d0d11;
  --adm-surface: #121218;
  --adm-surface-2: #1a1a23;
  --adm-border: #2a2a36;
  --adm-text: #e8e8f0;
  --adm-muted: #9a9aae;
  --adm-cyan: var(--color-cyan, #00f0ff);
  --adm-magenta: #ff007a;
  --adm-violet: #8a2be2;
  --adm-ok: #3ddc97;
  --adm-warn: #ffb020;

  display: grid;
  grid-template-columns: 1fr;
  min-height: 70vh;
  background: var(--adm-bg);
  color: var(--adm-text);
}

.adm-nav {
  background: var(--adm-surface);
  border-bottom: 1px solid var(--adm-border);
  padding: 0.75rem 1rem;
}

.adm-nav__title {
  margin: 0 0 0.5rem;
  font-weight: 600;
  color: var(--adm-muted);
  font-size: 0.875rem;
}

.adm-nav__list {
  display: flex;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: auto;
}

.adm-nav a {
  display: block;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  color: var(--adm-text);
  text-decoration: none;
  white-space: nowrap;
  border: 1px solid transparent;
}

.adm-nav a:hover {
  background: var(--adm-surface-2);
}

.adm-nav a:focus-visible {
  outline: 2px solid var(--adm-cyan);
  outline-offset: 2px;
}

.adm-nav a.is-active {
  border-color: var(--adm-cyan);
  color: var(--adm-cyan);
  box-shadow: 0 0 12px rgb(0 240 255 / 25%);
}

.adm-nav__back {
  margin-left: auto;
}

.adm-nav__back a {
  color: var(--adm-muted);
}

.adm-main {
  padding: 1rem;
  min-width: 0;
}

@media (min-width: 900px) {
  .adm {
    grid-template-columns: 15rem 1fr;
  }

  .adm-nav {
    border-bottom: 0;
    border-right: 1px solid var(--adm-border);
    padding: 1.5rem 1rem;
  }

  .adm-nav__list {
    flex-direction: column;
    overflow: visible;
  }

  .adm-nav__back {
    margin-left: 0;
    margin-top: 1.5rem;
  }

  .adm-main {
    padding: 2rem;
  }
}
</style>

<!-- Estilos compartidos por las vistas del panel (prefijo adm- para no chocar con el resto) -->
<style>
.adm-page {
  max-width: 72rem;
  margin: 0 auto;
}

.adm-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.adm-title {
  margin: 0;
  font-size: 1.5rem;
}

.adm-card {
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: 0.75rem;
  padding: 1rem;
}

.adm-label {
  display: grid;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--adm-muted);
}

.adm-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.625rem 0.75rem;
  background: var(--adm-bg);
  color: var(--adm-text);
  border: 1px solid var(--adm-border);
  border-radius: 0.5rem;
  font: inherit;
}

.adm-input:focus-visible {
  outline: none;
  border-color: var(--adm-cyan);
  box-shadow: 0 0 10px rgb(0 240 255 / 30%);
}

.adm-input[aria-invalid='true'] {
  border-color: var(--adm-magenta);
}

.adm-input--sm {
  width: 5.5rem;
  padding: 0.375rem 0.5rem;
}

.adm-error {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--adm-magenta);
}

.adm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.875rem;
  background: transparent;
  color: var(--adm-text);
  border: 1px solid var(--adm-border);
  border-radius: 0.5rem;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.adm-btn:hover:not(:disabled) {
  border-color: var(--adm-cyan);
  color: var(--adm-cyan);
}

.adm-btn:focus-visible {
  outline: 2px solid var(--adm-cyan);
  outline-offset: 2px;
}

.adm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.adm-btn--danger:hover:not(:disabled) {
  border-color: var(--adm-magenta);
  color: var(--adm-magenta);
}

.adm-tag {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--adm-border);
  font-size: 0.75rem;
  color: var(--adm-muted);
}

.adm-tag--cyan {
  border-color: var(--adm-cyan);
  color: var(--adm-cyan);
}

.adm-tag--violet {
  border-color: var(--adm-violet);
  color: #c28bff;
}

.adm-tag--ok {
  border-color: var(--adm-ok);
  color: var(--adm-ok);
}

.adm-tag--warn {
  border-color: var(--adm-warn);
  color: var(--adm-warn);
}

.adm-tag--danger {
  border-color: var(--adm-magenta);
  color: var(--adm-magenta);
}

.adm-state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--adm-muted);
}

.adm-state--error {
  color: var(--adm-magenta);
}

.adm-alert {
  padding: 0.875rem 1rem;
  border: 1px solid var(--adm-warn);
  border-radius: 0.75rem;
  background: rgb(255 176 32 / 8%);
  color: var(--adm-warn);
}

.adm-table-wrap {
  overflow-x: auto;
}

.adm-table {
  width: 100%;
  border-collapse: collapse;
}

.adm-table th,
.adm-table td {
  padding: 0.75rem;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--adm-border);
}

.adm-table th {
  font-weight: 600;
  color: var(--adm-muted);
  font-size: 0.875rem;
}

/* En móvil la tabla se convierte en tarjetas: cada celda muestra su data-label */
@media (max-width: 767px) {
  .adm-table thead {
    position: absolute;
    left: -9999px;
  }

  .adm-table,
  .adm-table tbody,
  .adm-table tr,
  .adm-table td {
    display: block;
  }

  .adm-table tr {
    margin-bottom: 0.75rem;
    border: 1px solid var(--adm-border);
    border-radius: 0.75rem;
    background: var(--adm-surface);
  }

  .adm-table td {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--adm-border);
  }

  .adm-table td:last-child {
    border-bottom: 0;
  }

  .adm-table td::before {
    content: attr(data-label);
    color: var(--adm-muted);
    flex-shrink: 0;
  }

  .adm-table td > * {
    text-align: right;
  }
}

@media (prefers-reduced-motion: reduce) {
  .adm * {
    transition: none !important;
    animation: none !important;
  }
}
</style>

