import { Router } from 'express'
import { ordersController } from '../controllers/orders.controller.js'
import { requireAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { createOrderSchema, trackingParamsSchema } from '../schemas/order.schema.js'

const router = Router()

// Confirmar la compra: crea el pedido desde el carrito del usuario logueado
router.post('/', requireAuth, validate(createOrderSchema), ordersController.create)

// Detalle de un pedido por código de seguimiento (solo el dueño o un admin)
router.get(
  '/:tracking',
  requireAuth,
  validate(trackingParamsSchema, 'params'),
  ordersController.getByTracking,
)

export default router
