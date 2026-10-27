import { Router } from 'express'
import { validate } from '../middlewares/validate.js'
import { registerSchema } from '../schemas/auth.schema.js'
import * as authController from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.js'


const router = Router()

router.post('/register', validate(registerSchema), authController.register)

router.get('/me', requireAuth, authController.getMe)

export default router