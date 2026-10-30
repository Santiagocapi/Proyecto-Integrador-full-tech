export const isRequired = (value) => {
  if (value === null || value === undefined) return false
  return String(value).trim().length > 0
}

export const isEmail = (value) => {
  if (!isRequired(value)) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}

export const isStrongPassword = (value) => {
  if (!isRequired(value)) return false
  const str = String(value)
  return str.length >= 8 && /[A-Z]/.test(str) && /[0-9]/.test(str)
}

export const isPhone = (value) => {
  if (!isRequired(value)) return true // Opcional salvo que se combine con required
  return /^[0-9+\-\s()]{7,20}$/.test(String(value).trim())
}

export const minLength = (min) => (value) => {
  if (!isRequired(value)) return false
  return String(value).trim().length >= min
}

export const validateEmail = (value) => {
  if (!isRequired(value)) return 'El email es obligatorio'
  if (!isEmail(value)) return 'El formato del email no es válido'
  return ''
}

export const validatePassword = (value) => {
  if (!isRequired(value)) return 'La contraseña es obligatoria'
  if (String(value).length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (!/[A-Z]/.test(String(value))) return 'Debe incluir al menos una letra mayúscula'
  if (!/[0-9]/.test(String(value))) return 'Debe incluir al menos un número'
  return ''
}

export const validateFullName = (value) => {
  if (!isRequired(value)) return 'El nombre completo es obligatorio'
  if (String(value).trim().length < 2) return 'El nombre debe tener al menos 2 caracteres'
  return ''
}

export const validatePhone = (value) => {
  if (!isRequired(value)) return ''
  if (!isPhone(value)) return 'El formato del teléfono no es válido'
  return ''
}