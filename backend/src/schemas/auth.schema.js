import { z } from 'zod'
import { emailSchema, passwordSchema, phoneSchema } from './common.schema.js'

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z
    .string({ required_error: 'El nombre completo es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: phoneSchema
})