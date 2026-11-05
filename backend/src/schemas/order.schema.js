import { z } from 'zod'
import { requiredPhoneSchema } from './common.schema.js'

const requiredText = (label, max) =>
  z
    .string({ error: `${label} es obligatorio` })
    .trim()
    .min(1, `${label} es obligatorio`)
    .max(max, `${label} no puede superar los ${max} caracteres`)

// Código postal argentino: 4 dígitos (5600) o CPA (M5600ABC)
const zipSchema = z
  .string({ error: 'El código postal es obligatorio' })
  .trim()
  .toUpperCase()
  .regex(/^(\d{4}|[A-Z]\d{4}[A-Z]{3})$/, 'El código postal no es válido')

export const createOrderSchema = z.object({
  shipping: z.object(
    {
      name: requiredText('El nombre', 120),
      address: requiredText('La dirección', 200),
      city: requiredText('La ciudad', 100),
      zip: zipSchema,
      phone: requiredPhoneSchema,
    },
    { error: 'Los datos de envío son obligatorios' },
  ),
  paymentMethod: z.enum(['mercadopago', 'transferencia', 'efectivo'], {
    error: 'El método de pago no es válido',
  }),
})
