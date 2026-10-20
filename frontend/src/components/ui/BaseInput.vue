<script setup>
import { useId } from 'vue'

// v-model: el valor del campo. Uso: <BaseInput v-model="email" label="Email" />
const model = defineModel({ type: [String, Number], default: '' })

defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  // Mensaje de error: si tiene texto, el campo se pinta en rojo y lo muestra abajo
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  autocomplete: { type: String, default: 'off' },
})

const id = useId()
</script>

<template>
  <div class="base-input" :class="{ 'base-input--error': error, 'base-input--disabled': disabled }">
    <label :for="id" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required" aria-hidden="true">*</span>
    </label>

    <input
      :id="id"
      v-model="model"
      class="base-input__field"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :autocomplete="autocomplete"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error || hint ? `${id}-message` : undefined"
    />

    <p
      v-if="error"
      :id="`${id}-message`"
      class="base-input__message base-input__message--error"
      role="alert"
    >
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${id}-message`" class="base-input__message">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.base-input__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.base-input__required {
  color: var(--color-magenta);
}

.base-input__field {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.base-input__field::placeholder {
  color: var(--color-text-muted);
}

.base-input__field:hover {
  border-color: var(--color-text-muted);
}

/* El glow reemplaza al contorno de foco global en este campo */
.base-input__field:focus-visible {
  outline: none;
  border-color: var(--color-cyan);
  box-shadow: var(--glow-cyan);
}

.base-input--error .base-input__field {
  border-color: var(--color-error);
}

.base-input--error .base-input__field:focus-visible {
  box-shadow: 0 0 10px var(--color-error);
}

.base-input--disabled .base-input__field {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-input__message {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.base-input__message--error {
  color: var(--color-error);
}
</style>
