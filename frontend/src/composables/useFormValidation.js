import { reactive, computed } from 'vue'

export function useFormValidation(rules = {}) {
  const errors = reactive({})

  const validateField = (field, value, customForm = {}) => {
    const fieldRules = rules[field]
    if (!fieldRules) return true

    const ruleList = Array.isArray(fieldRules) ? fieldRules : [fieldRules]

    for (const rule of ruleList) {
      const result = rule(value, customForm)
      if (typeof result === 'string' && result.length > 0) {
        errors[field] = result
        return false
      }
      if (result === false) {
        errors[field] = 'Campo inválido'
        return false
      }
    }

    delete errors[field]
    return true
  }

  const validate = (form) => {
    let isValid = true
    for (const field of Object.keys(rules)) {
      const ok = validateField(field, form[field], form)
      if (!ok) isValid = false
    }
    return isValid
  }

  const setFieldError = (field, message) => {
    if (message) {
      errors[field] = message
    } else {
      delete errors[field]
    }
  }

  const clearErrors = () => {
    for (const key of Object.keys(errors)) {
      delete errors[key]
    }
  }

  const isValid = computed(() => Object.keys(errors).length === 0)

  return {
    errors,
    isValid,
    validateField,
    validate,
    setFieldError,
    clearErrors,
  }
}