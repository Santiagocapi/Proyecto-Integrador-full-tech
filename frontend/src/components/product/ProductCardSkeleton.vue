<!-- Tarjeta gris que ocupa el lugar de un ProductCard mientras carga -->
<template>
  <div class="card skeleton" aria-hidden="true">
    <div class="skeleton__media"></div>
    <div class="skeleton__body">
      <div class="skeleton__line skeleton__line--short"></div>
      <div class="skeleton__line"></div>
      <div class="skeleton__line skeleton__line--price"></div>
      <div class="skeleton__button"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Que no brille como las tarjetas reales */
.skeleton:hover {
  border-color: var(--color-border);
  box-shadow: none;
  transform: none;
}

.skeleton__media {
  aspect-ratio: 1 / 1;
  background-color: var(--color-surface-2);
}

.skeleton__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5) var(--space-5);
}

.skeleton__line,
.skeleton__button,
.skeleton__media {
  animation: pulse 1.4s ease-in-out infinite;
}

.skeleton__line {
  height: 14px;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-2);
}

.skeleton__line--short {
  width: 40%;
}

.skeleton__line--price {
  width: 55%;
  height: 20px;
}

.skeleton__button {
  height: 44px;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-2);
}

@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}
</style>
