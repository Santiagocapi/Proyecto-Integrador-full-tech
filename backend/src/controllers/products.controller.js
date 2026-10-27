import { productsService } from '../services/products.service.js'

export const productsController = {
  async list(req, res, next) {
    try {
      const query = req.validatedQuery

      const result = await productsService.list(query)

      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  async getBySlug(req, res, next) {
    try {
      const { slug } = req.params

      const product = await productsService.getBySlug(slug)

      res.json(product)
    } catch (error) {
      next(error)
    }
  },
}