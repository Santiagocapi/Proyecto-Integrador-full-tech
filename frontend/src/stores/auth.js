import { defineStore } from 'pinia'

// TODO (Rocío): implementar con Supabase Auth manteniendo esta interfaz.
// Aca va la store de autenticación, que maneja el estado del usuario y su perfil. Se puede usar para saber si el usuario está logueado, si es administrador y para manejar el login, registro y logout.
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, profile: null }),
  getters: {
    isLoggedIn: (state) => Boolean(state.user),
    isAdmin: (state) => state.profile?.role === 'admin',
  },
  actions: {
    async init() {},
    async login() {},
    async register() {},
    async logout() {
      this.user = null
      this.profile = null
    },
  },
})