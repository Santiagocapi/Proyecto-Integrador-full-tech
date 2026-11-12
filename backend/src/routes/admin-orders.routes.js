import { Router } from 'express'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import * as adminOrdersController from '../controllers/admin-orders.controller.js'
import {
  listAdminOrdersSchema,
  orderIdParamsSchema,
  updateOrderStatusSchema,
} from '../schemas/admin-order.schema.js'

const router = Router()

// Se monta en app.js bajo /api/admin/orders
router.get(
  '/',
  requireAuth,
  requireRole('admin'),
  validate(listAdminOrdersSchema, 'query'),
  adminOrdersController.list,
)

router.patch(
  '/:id/status',
  requireAuth,
  requireRole('admin'),
  validate(orderIdParamsSchema, 'params'),
  validate(updateOrderStatusSchema),
  adminOrdersController.updateStatus,
)

export default router
