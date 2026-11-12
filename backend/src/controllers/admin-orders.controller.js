import * as adminOrdersService from '../services/admin-orders.service.js'

// GET /api/admin/orders?status=
export async function list(req, res, next) {
  try {
    const items = await adminOrdersService.list({ status: req.query.status })
    res.status(200).json({ items, total: items.length })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/admin/orders/:id/status   body: { status }
export async function updateStatus(req, res, next) {
  try {
    const id = Number(req.params.id)
    const result = await adminOrdersService.updateStatus(id, req.body.status)

    if (result.error === 'not_found') {
      return res.status(404).json({ error: 'Pedido no encontrado' })
    }
    if (result.error === 'cancelled') {
      return res
        .status(409)
        .json({ error: 'Un pedido cancelado no puede cambiar de estado' })
    }
    if (result.error === 'conflict') {
      return res
        .status(409)
        .json({ error: 'El pedido cambió mientras lo editabas. Recargá e intentá de nuevo' })
    }

    res.status(200).json({ order: result.order })
  } catch (err) {
    next(err)
  }
}
