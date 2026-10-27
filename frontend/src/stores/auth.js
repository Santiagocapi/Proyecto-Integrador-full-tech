import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { api } from '@/services/api'

let initPromise = null
let authSubscription = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    profileRequest: 0,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.user),
    // Exigimos sesión activa además de que el rol sea admin
    isAdmin: (state) =>
      Boolean(state.user) && state.profile?.id === state.user.id && state.profile?.role === 'admin',
  },
  actions: {
    async fetchProfile() {
      const userId = this.user?.id
      const requestId = ++this.profileRequest
      this.profile = null
      if (!userId) return
      try {
        const profileData = await api.get('/auth/me', { auth: true })

        // Si el usuario cerró sesión mientras la petición estaba en curso, descartamos el resultado
        if (requestId !== this.profileRequest || this.user?.id !== userId) return

        this.profile = profileData?.id === userId ? profileData : null
      } catch {
        if (requestId === this.profileRequest && this.user?.id === userId) this.profile = null
      }
    },

    async init() {
      if (initPromise) return initPromise

      initPromise = (async () => {
        const { data } = await supabase.auth.getSession()
        this.user = data.session?.user ?? null

        if (this.user) {
          await this.fetchProfile()
        } else {
          this.profile = null
        }

        if (!authSubscription) {
          const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            this.user = session?.user ?? null
            this.profile = null
            ++this.profileRequest
            if (this.user) {
              // La consulta espera a que Supabase libere el bloqueo de sesión.
              setTimeout(() => {
                if (this.user) void this.fetchProfile()
              }, 0)
            } else {
              this.profile = null
            }
          })
          authSubscription = listener?.subscription
        }
      })()

      return initPromise
    },

    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error('Email o contraseña incorrectos')
      }

      this.user = data.user
      await this.fetchProfile()
      return this.profile
    },

    async register(payload) {
      await api.post('/auth/register', payload)
      return await this.login(payload.email, payload.password)
    },

    async logout() {
      this.user = null
      this.profile = null
      ++this.profileRequest
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  },
})
