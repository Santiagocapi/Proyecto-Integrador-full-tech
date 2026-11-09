import { ordersService } from '../services/orders.service.js'

export const ordersController = {
  async create(req, res, next) {
    try {
      const { shipping, paymentMethod } = req.body
      const order = await ordersService.create({ user: req.user, shipping, paymentMethod })
      res.status(201).json(order)
    } catch (error) {
      next(error)
    }
  },

  // Pedidos del usuario logueado (GET /api/me/orders)
  async listMine(req, res, next) {
    try {
      const orders = await ordersService.listByUser(req.user.id)
      res.json(orders)
    } catch (error) {
      next(error)
    }
  },

  async getByTracking(req, res, next) {
    try {
      const { tracking } = req.validatedParams
      const order = await ordersService.getByTracking(tracking, req.user)
      res.json(order)
    } catch (error) {
      next(error)
    }
  },
}
