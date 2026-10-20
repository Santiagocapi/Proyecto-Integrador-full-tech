<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFormValidation } from '@/composables/useFormValidation'
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validatePhone,
} from '@/utils/validators'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  full_name: '',
  email: '',
  phone: '',
  password: '',
})

const serverError = ref('')
const loading = ref(false)

const { errors, validateField, validate } = useFormValidation({
  full_name: validateFullName,
  email: validateEmail,
  phone: validatePhone,
  password: validatePassword,
})

const handleSubmit = async () => {
  serverError.value = ''
  if (!validate(form)) return

  loading.value = true
  try {
    await auth.register({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      password: form.password,
    })
    router.push({ name: 'home' })
  } catch (err) {
    serverError.value = err.message || 'No se pudo completar el registro'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Crear cuenta</h1>
      <p class="auth-subtitle">Sumate a FULL-TECH para armar tu setup y seguir tus pedidos.</p>

      <p v-if="serverError" class="alert-error" role="alert">{{ serverError }}</p>

      <form class="auth-form" novalidate @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="full_name">Nombre completo</label>
          <input
            id="full_name"
            v-model="form.full_name"
            type="text"
            placeholder="Ej: Rocío Lucero"
            autocomplete="name"
            @input="validateField('full_name', form.full_name)"
            @blur="validateField('full_name', form.full_name)"
          />
          <span v-if="errors.full_name" class="field-error">{{ errors.full_name }}</span>
        </div>

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
          <label for="phone">Teléfono (opcional)</label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            placeholder="+54 9 260 4123456"
            autocomplete="tel"
            @input="validateField('phone', form.phone)"
            @blur="validateField('phone', form.phone)"
          />
          <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
            autocomplete="new-password"
            @input="validateField('password', form.password)"
            @blur="validateField('password', form.password)"
          />
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Creando cuenta...' : 'Registrarme' }}
        </button>
      </form>

      <p class="auth-footer">
        ¿Ya tenés cuenta?
        <RouterLink :to="{ name: 'login' }">Ingresá acá</RouterLink>
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
  max-width: 440px;
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