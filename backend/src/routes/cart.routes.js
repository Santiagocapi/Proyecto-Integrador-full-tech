import { Router } from 'express'
import { cartController } from '../controllers/cart.controller.js'
import { requireAuth } from '../middlewares/auth.js'

const router = Router()

// Todas las rutas del carrito exigen estar logueado
router.use(requireAuth)

router.get('/', cartController.get)
router.put('/', cartController.update)
router.post('/merge', cartController.merge)

export default router