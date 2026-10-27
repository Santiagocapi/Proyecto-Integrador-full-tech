import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { api } from '@/services/api'

let initPromise = null
let authSubscription = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.user),
    // Exigimos sesión activa además de que el rol sea admin
    isAdmin: (state) => Boolean(state.user) && state.profile?.role === 'admin',
  },
  actions: {
    async fetchProfile() {
      try {
        const profileData = await api.get('/auth/me', { auth: true })
        
        // Si el usuario cerró sesión mientras la petición estaba en curso, descartamos el resultado
        if (!this.user) {
          this.profile = null
          return
        }
        
        this.profile = profileData
      } catch {
        this.profile = null
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
          const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            this.user = session?.user ?? null
            if (this.user) {
              await this.fetchProfile()
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
      await supabase.auth.signOut()
      this.user = null
      this.profile = null
    },
  },
})
