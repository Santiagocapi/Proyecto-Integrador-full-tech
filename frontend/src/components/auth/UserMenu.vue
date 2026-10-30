<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

const displayName = computed(() => {
  return auth.profile?.full_name || auth.user?.email || 'Mi cuenta'
})

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}

const handleLogout = async () => {
  closeMenu()
  await auth.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="user-menu">
    <RouterLink v-if="!auth.isLoggedIn" :to="{ name: 'login' }" class="btn-login">
      Ingresar
    </RouterLink>

    <div v-else class="user-dropdown">
      <button
        type="button"
        class="user-trigger"
        :aria-expanded="menuOpen"
        @click="toggleMenu"
      >
        <span class="user-name">{{ displayName }}</span>
      </button>

      <div v-if="menuOpen" class="dropdown-panel" @click="closeMenu">
        <RouterLink :to="{ name: 'account' }" class="dropdown-item">
          Mi cuenta
        </RouterLink>
        <RouterLink v-if="auth.isAdmin" :to="{ name: 'admin' }" class="dropdown-item">
          Panel admin
        </RouterLink>
        <button type="button" class="dropdown-item btn-logout" @click="handleLogout">
          Cerrar sesión
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.btn-login {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-cyan, #00f0ff);
  color: var(--color-cyan, #00f0ff);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}

.user-trigger {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--color-text, #ffffff);
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}

.dropdown-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  min-width: 180px;
  background: var(--color-surface, #121218);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 0.4rem;
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.dropdown-item {
  padding: 0.6rem 0.8rem;
  color: var(--color-text, #ffffff);
  text-decoration: none;
  font-size: 0.9rem;
  border-radius: 6px;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
}

.dropdown-item:hover {
  background: rgba(0, 240, 255, 0.1);
  color: var(--color-cyan, #00f0ff);
}

.btn-logout {
  color: var(--color-magenta, #ff007a);
}
</style>