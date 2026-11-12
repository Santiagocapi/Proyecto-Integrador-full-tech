import { Router } from 'express'
import { webhooksController } from '../controllers/webhooks.controller.js'

const router = Router()

// Notificaciones de pago de Mercado Pago (sin login: se valida la firma del aviso)
router.post('/mercadopago', webhooksController.mercadopago)

export default router
