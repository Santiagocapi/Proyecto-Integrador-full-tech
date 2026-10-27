import { Router } from 'express'
import { validateQuery } from '../middlewares/validate.js'
import { productQuerySchema } from '../schemas/product.schema.js'
import { productsController } from '../controllers/products.controller.js'

const router = Router()

router.get('/', validateQuery(productQuerySchema), productsController.list)
router.get('/:slug', productsController.getBySlug)

export default router