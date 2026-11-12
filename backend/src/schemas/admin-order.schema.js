import { z } from 'zod'

// Estados definidos en la tabla orders (sección 3 del plan)
export const ORDER_STATUSES = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']

export const listAdminOrdersSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
})

export const orderIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
})
