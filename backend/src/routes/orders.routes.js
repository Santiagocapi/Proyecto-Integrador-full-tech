import { Router } from 'express'
import { ordersController } from '../controllers/orders.controller.js'
import { requireAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { createOrderSchema } from '../schemas/order.schema.js'

const router = Router()

// Confirmar la compra: crea el pedido desde el carrito del usuario logueado
router.post('/', requireAuth, validate(createOrderSchema), ordersController.create)

export default router
