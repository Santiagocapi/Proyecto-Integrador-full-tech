import { Router } from 'express'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import * as adminStatsController from '../controllers/admin-stats.controller.js'

const router = Router()

// Se monta en app.js bajo /api/admin/stats
router.get('/', requireAuth, requireRole('admin'), adminStatsController.get)

export default router
