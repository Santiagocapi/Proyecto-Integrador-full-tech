import { Router } from 'express'
import { validate } from '../middlewares/validate.js'
import { registerSchema } from '../schemas/auth.schema.js'
import * as authController from '../controllers/auth.controller.js'

const router = Router()

router.post('/register', validate(registerSchema), authController.register)

export default router