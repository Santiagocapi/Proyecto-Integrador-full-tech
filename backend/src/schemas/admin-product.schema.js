import { z } from 'zod'

export const idSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .refine((id) => /^[1-9]\d*$/.test(id) && BigInt(id) <= 9223372036854775807n)
const money = z.number().min(0).max(99999999.99).multipleOf(0.01)
const variant = z
  .object({
    id: idSchema.optional(),
    name: z.string().trim().min(1).max(200),
    sku: z.string().trim().min(1).max(100),
    stock: z.number().int().min(0).max(2147483647),
  })
  .strict()

export const adminProductSchema = z
  .object({
    category_id: idSchema,
    name: z.string().trim().min(1).max(200),
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().max(10000).nullable().default(null),
    price: money,
    offer_price: money.nullable().default(null),
    connection_type: z.string().max(100).nullable().default(null),
    compatibility: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
    specs: z.record(z.string(), z.json()).default({}),
    images: z
      .array(z.url().refine((url) => /^https?:\/\//.test(url)))
      .max(20)
      .default([]),
    is_bundle: z.boolean().default(false),
    active: z.boolean().default(true),
    variants: z.array(variant).min(1).max(100),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.offer_price !== null && data.offer_price > data.price) {
      ctx.addIssue({
        code: 'custom',
        path: ['offer_price'],
        message: 'La oferta supera el precio normal',
      })
    }
    for (const field of ['sku', 'id']) {
      const values = data.variants.map((item) => item[field]).filter(Boolean)
      if (new Set(values).size !== values.length)
        ctx.addIssue({ code: 'custom', path: ['variants'], message: `${field} duplicado` })
    }
  })
export const stockSchema = z.object({ stock: z.number().int().min(0).max(2147483647) }).strict()
export const resourceParamsSchema = z.object({ id: idSchema })
