import { Router } from 'express'
import multer from 'multer'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
  adminProductSchema,
  stockSchema,
  resourceParamsSchema,
} from '../schemas/admin-product.schema.js'
import { adminProductsService as service } from '../services/admin-products.service.js'

const router = Router()
router.use(requireAuth, requireRole('admin'))
router.post('/products', validate(adminProductSchema), async (req, res) => {
  res.status(201).json(await service.save(null, req.body))
})
router.put(
  '/products/:id',
  validate(resourceParamsSchema, 'params'),
  validate(adminProductSchema),
  async (req, res) => {
    res.json(await service.save(req.validatedParams.id, req.body))
  },
)
router.delete('/products/:id', validate(resourceParamsSchema, 'params'), async (req, res) => {
  res.json(await service.deactivate(req.validatedParams.id))
})
router.patch(
  '/variants/:id',
  validate(resourceParamsSchema, 'params'),
  validate(stockSchema),
  async (req, res) => {
    res.json(await service.stock(req.validatedParams.id, req.body))
  },
)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
}).single('file')
router.post(
  '/uploads',
  (req, res, next) => {
    upload(req, res, (error) => {
      if (error)
        return res
          .status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
          .json({
            error:
              error.code === 'LIMIT_FILE_SIZE'
                ? 'La imagen supera 2 MB'
                : 'Archivo de imagen inválido',
          })
      next()
    })
  },
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo file' })
    res.status(201).json(await service.upload(req.file))
  },
)
export default router
