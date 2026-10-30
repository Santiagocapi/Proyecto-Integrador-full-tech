import { categoriesService } from '../services/categories.service.js'

export const categoriesController = {
  async list(req, res, next) {
    try {
      const categories = await categoriesService.list()

      res.json(categories)
    } catch (error) {
      next(error)
    }
  },
}