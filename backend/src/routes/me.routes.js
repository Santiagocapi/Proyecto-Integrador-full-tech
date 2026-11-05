import { Router } from 'express';
import { meController } from '../controllers/me.controller.js';
import { ordersController } from '../controllers/orders.controller.js';
import { updateProfileSchema } from '../schemas/user.schema.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

// Endpoint PUT /api/me protegido con autenticación y validación Zod
router.put('/me', requireAuth, validate(updateProfileSchema), meController.updateProfile);
router.get('/me', requireAuth, meController.getProfile);
// Historial de pedidos del usuario autenticado
router.get('/me/orders', requireAuth, ordersController.listMine);

export default router;