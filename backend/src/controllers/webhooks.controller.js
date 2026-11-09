import { handleMercadoPagoNotification } from '../services/webhooks.service.js'

export const webhooksController = {
  async mercadopago(req, res, next) {
    try {
      const { query, headers, body } = req
      const result = await handleMercadoPagoNotification({ query, headers, body })
      res.status(result.status).json(result.body)
    } catch (error) {
      next(error)
    }
  },
}
