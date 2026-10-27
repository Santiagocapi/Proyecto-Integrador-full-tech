import { z } from 'zod'

export const emailSchema = z
  .string({ required_error: 'El email es obligatorio' })
  .trim()
  .email('El formato del email no es válido')
  .toLowerCase()

export const passwordSchema = z
  .string({ required_error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número')

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s()]{7,20}$/, 'El formato del teléfono no es válido')
  .optional()
  .or(z.literal(''))