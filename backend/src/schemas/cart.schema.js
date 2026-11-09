import { z } from 'zod'

const id = z.union([
  z
    .string()
    .max(19)
    .regex(/^[1-9]\d*$/)
    .refine(
      (value) =>
        /^[1-9]\d*$/.test(value) && value.length <= 19 && BigInt(value) <= 9223372036854775807n,
    ),
  z.number().int().positive().max(Number.MAX_SAFE_INTEGER).transform(String),
])
const item = z
  .object({
    variantId: id.optional(),
    variant_id: id.optional(),
    quantity: z.number().int().min(1).max(2147483647),
  })
  .refine(
    (value) =>
      Boolean(value.variantId || value.variant_id) &&
      (!value.variantId || !value.variant_id || value.variantId === value.variant_id),
    { message: 'La variante es obligatoria y debe ser única' },
  )
  .transform((value) => ({
    variant_id: value.variantId ?? value.variant_id,
    quantity: value.quantity,
  }))
const items = z
  .array(item)
  .max(100)
  .refine((values) => new Set(values.map((value) => value.variant_id)).size === values.length, {
    message: 'No se puede repetir una variante',
  })
export const cartSchema = z.object({ items }).strict()
export const cartMergeSchema = z.object({ items, mergeId: z.uuid() }).strict()
