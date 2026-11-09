<script setup>
import BaseInput from '@/components/ui/BaseInput.vue'
import { useFormValidation } from '@/composables/useFormValidation'
import { isRequired, isPhone, isZip } from '@/utils/validators'

// v-model: objeto { name, address, city, zip, phone }. El padre lo precarga desde el perfil.
const model = defineModel({
  type: Object,
  default: () => ({ name: '', address: '', city: '', zip: '', phone: '' }),
})

// Regla genérica: obligatorio y con largo máximo (mismos límites que el backend)
const requiredMax = (label, max) => (value) => {
  if (!isRequired(value)) return `${label} es obligatorio`
  if (String(value).trim().length > max) return `${label} no puede superar los ${max} caracteres`
  return true
}

const rules = {
  name: requiredMax('El nombre', 120),
  address: requiredMax('La dirección', 200),
  city: requiredMax('La ciudad', 100),
  zip: (value) => {
    if (!isRequired(value)) return 'El código postal es obligatorio'
    if (!isZip(value)) return 'Ingresá un código postal válido (ej. 5000 o C1425ABC)'
    return true
  },
  phone: (value) => {
    if (!isRequired(value)) return 'El teléfono es obligatorio'
    if (!isPhone(value)) return 'El formato del teléfono no es válido'
    return true
  },
}

const { errors, validate: validateForm, validateField } = useFormValidation(rules)

const fields = [
  { key: 'name', label: 'Nombre y apellido', autocomplete: 'name', placeholder: 'Quién recibe el pedido' },
  { key: 'address', label: 'Dirección', autocomplete: 'street-address', placeholder: 'Calle, número, piso' },
  { key: 'city', label: 'Ciudad', autocomplete: 'address-level2', placeholder: '' },
  { key: 'zip', label: 'Código postal', autocomplete: 'postal-code', placeholder: '5000 o C1425ABC' },
  { key: 'phone', label: 'Teléfono', autocomplete: 'tel', placeholder: '+54 9 351 555-1234', type: 'tel' },
]

function update(field, value) {
  model.value = { ...model.value, [field]: value }
  // Si el campo ya tenía error, lo revalidamos mientras el usuario corrige
  if (errors[field]) validateField(field, value)
}

// El padre llama a validate() antes de confirmar el pedido
function validate() {
  return validateForm(model.value)
}

defineExpose({ validate })
</script>

<template>
  <section class="shipping-form" aria-labelledby="shipping-form-title">
    <h2 id="shipping-form-title" class="shipping-form__title">Datos de envío</h2>

    <div class="shipping-form__grid">
      <BaseInput
        v-for="field in fields"
        :key="field.key"
        :class="`shipping-form__field--${field.key}`"
        :model-value="model[field.key]"
        :label="field.label"
        :type="field.type ?? 'text'"
        :placeholder="field.placeholder"
        :autocomplete="field.autocomplete"
        :error="errors[field.key] ?? ''"
        required
        @update:model-value="update(field.key, $event)"
        @focusout="validateField(field.key, model[field.key])"
      />
    </div>
  </section>
</template>

<style scoped>
.shipping-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.shipping-form__title {
  font-size: var(--text-xl);
}

.shipping-form__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .shipping-form__grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .shipping-form__field--name,
  .shipping-form__field--address {
    grid-column: 1 / -1;
  }
}
</style>
