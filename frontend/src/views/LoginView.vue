<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFormValidation } from '@/composables/useFormValidation'
import { validateEmail, isRequired } from '@/utils/validators'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const serverError = ref('')
const loading = ref(false)

const { errors, validateField, validate } = useFormValidation({
  email: validateEmail,
  password: (val) => (isRequired(val) ? '' : 'La contraseña es obligatoria'),
})

const handleSubmit = async () => {
  serverError.value = ''
  if (!validate(form)) return

  loading.value = true
  try {
    await auth.login(form.email.trim(), form.password)
    const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirectPath)
  } catch (err) {
    serverError.value = err.message || 'Email o contraseña incorrectos'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Ingresar</h1>
      <p class="auth-subtitle">Accedé a tu cuenta para gestionar tu carrito y tus compras.</p>

      <p v-if="serverError" class="alert-error" role="alert">{{ serverError }}</p>

      <form class="auth-form" novalidate @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="tu@email.com"
            autocomplete="email"
            @input="validateField('email', form.email)"
            @blur="validateField('email', form.email)"
          />
          <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Tu contraseña"
            autocomplete="current-password"
            @input="validateField('password', form.password)"
            @blur="validateField('password', form.password)"
          />
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <p class="auth-footer">
        ¿No tenés cuenta todavía?
        <RouterLink :to="{ name: 'register' }">Registrate acá</RouterLink>
      </p>
    </div>
  </section>
</template>

<style scoped>
.auth-page {
  min-height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface, #121218);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
}

.auth-title {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: var(--color-text, #ffffff);
}

.auth-subtitle {
  color: var(--color-text-muted, #a0a0b0);
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

.alert-error {
  background: rgba(255, 0, 122, 0.15);
  border: 1px solid var(--color-magenta, #ff007a);
  color: #ffb3d9;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.9rem;
  color: var(--color-text, #ffffff);
}

.form-group input {
  padding: 0.75rem 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: var(--color-bg, #0d0d11);
  color: var(--color-text, #ffffff);
  font-size: 0.95rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-cyan, #00f0ff);
  box-shadow: 0 0 8px rgba(0, 240, 255, 0.25);
}

.field-error {
  color: var(--color-magenta, #ff007a);
  font-size: 0.82rem;
}

.btn-submit {
  margin-top: 0.5rem;
  padding: 0.85rem;
  border: none;
  border-radius: 8px;
  background: var(--color-cyan, #00f0ff);
  color: #0d0d11;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-muted, #a0a0b0);
}

.auth-footer a {
  color: var(--color-cyan, #00f0ff);
  text-decoration: none;
  font-weight: 600;
}
</style>