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
}
