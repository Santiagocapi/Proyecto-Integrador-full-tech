import { z } from 'zod'

export const productQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),

    limit: z.coerce.number().int().positive().max(100).default(10),

    category: z.string().trim().min(1).optional(),

    minPrice: z.coerce.number().nonnegative().optional(),

    maxPrice: z.coerce.number().nonnegative().optional(),

    connection: z.string().trim().min(1).optional(),

    compat: z.string().trim().min(1).optional(),

    q: z.string().trim().min(1).optional(),

    sort: z.enum(['price_asc', 'price_desc', 'newest']).optional(),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    {
      message: 'El precio máximo debe ser mayor o igual que el mínimo',
      path: ['maxPrice'],
    },
  )
