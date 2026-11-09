import { Router } from 'express'
import { cartController } from '../controllers/cart.controller.js'
import { requireAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { cartSchema, cartMergeSchema } from '../schemas/cart.schema.js'

const router = Router()

// Todas las rutas del carrito exigen estar logueado
router.use(requireAuth)

router.get('/', cartController.get)
router.put('/', validate(cartSchema), cartController.update)
router.post('/merge', validate(cartMergeSchema), cartController.merge)

export default router
