import { cartService } from '../services/cart.service.js'

export const cartController = {
  async get(req, res, next) {
    try {
      const userId = req.user.id
      const items = await cartService.getCart(userId)
      res.json(items)
    } catch (error) {
      next(error)
    }
  },

  async update(req, res, next) {
    try {
      const userId = req.user.id
      const { items } = req.body
      const updatedCart = await cartService.saveCart(userId, items)
      res.json(updatedCart)
    } catch (error) {
      next(error)
    }
  },

  async merge(req, res, next) {
    try {
      const userId = req.user.id
      const { items } = req.body
      const mergedCart = await cartService.mergeCart(userId, items || [])
      res.json(mergedCart)
    } catch (error) {
      next(error)
    }
  }
}