import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

// Auth simulada: sin header → 401, "Bearer admin" → admin, cualquier otro → comprador.
// La verificación real del token tiene sus propios tests (auth).
vi.mock('../src/middlewares/auth.js', () => ({
  requireAuth: (req, res, next) => {
    const header = req.headers.authorization
    if (!header) return res.status(401).json({ error: 'No autenticado' })
    req.user = { role: header === 'Bearer admin' ? 'admin' : 'comprador' }
    next()
  },
  requireRole: (role) => (req, res, next) =>
    req.user?.role === role ? next() : res.status(403).json({ error: 'Sin permisos' }),
}))

vi.mock('../src/services/admin-orders.service.js', () => ({
  list: vi.fn(),
  updateStatus: vi.fn(),
}))
vi.mock('../src/services/admin-stats.service.js', () => ({
  getStats: vi.fn(),
}))

import adminOrdersRoutes from '../src/routes/admin-orders.routes.js'
import adminStatsRoutes from '../src/routes/admin-stats.routes.js'
import * as ordersService from '../src/services/admin-orders.service.js'
import * as statsService from '../src/services/admin-stats.service.js'

const app = express()
app.use(express.json())
app.use('/api/admin/orders', adminOrdersRoutes)
app.use('/api/admin/stats', adminStatsRoutes)

const ADMIN = 'Bearer admin'
const BUYER = 'Bearer comprador'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/admin/orders', () => {
  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/admin/orders')
    expect(res.status).toBe(401)
  })

  it('responde 403 si el usuario es comprador', async () => {
    const res = await request(app).get('/api/admin/orders').set('Authorization', BUYER)
    expect(res.status).toBe(403)
    expect(ordersService.list).not.toHaveBeenCalled()
  })

  it('lista los pedidos para un admin', async () => {
    ordersService.list.mockResolvedValue([{ id: 1, status: 'pagado' }])
    const res = await request(app).get('/api/admin/orders').set('Authorization', ADMIN)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ items: [{ id: 1, status: 'pagado' }], total: 1 })
    expect(ordersService.list).toHaveBeenCalledWith({ status: undefined })
  })

  it('filtra por estado', async () => {
    ordersService.list.mockResolvedValue([])
    const res = await request(app)
      .get('/api/admin/orders?status=enviado')
      .set('Authorization', ADMIN)
    expect(res.status).toBe(200)
    expect(ordersService.list).toHaveBeenCalledWith({ status: 'enviado' })
  })

  it('responde 400 si el estado no existe', async () => {
    const res = await request(app)
      .get('/api/admin/orders?status=inventado')
      .set('Authorization', ADMIN)
    expect(res.status).toBe(400)
    expect(ordersService.list).not.toHaveBeenCalled()
  })

  it('responde 500 si falla el servicio', async () => {
    ordersService.list.mockRejectedValue(new Error('db caída'))
    const res = await request(app).get('/api/admin/orders').set('Authorization', ADMIN)
    expect(res.status).toBe(500)
  })
})

describe('PATCH /api/admin/orders/:id/status', () => {
  const patch = (id, body, token = ADMIN) => {
    const req = request(app).patch(`/api/admin/orders/${id}/status`).send(body)
    return token ? req.set('Authorization', token) : req
  }

  it('responde 401 sin token', async () => {
    const res = await patch(1, { status: 'enviado' }, null)
    expect(res.status).toBe(401)
  })

  it('responde 403 si el usuario es comprador', async () => {
    const res = await patch(1, { status: 'enviado' }, BUYER)
    expect(res.status).toBe(403)
    expect(ordersService.updateStatus).not.toHaveBeenCalled()
  })

  it('cambia el estado para un admin', async () => {
    ordersService.updateStatus.mockResolvedValue({ order: { id: 1, status: 'enviado' } })
    const res = await patch(1, { status: 'enviado' })
    expect(res.status).toBe(200)
    expect(res.body.order.status).toBe('enviado')
    expect(ordersService.updateStatus).toHaveBeenCalledWith(1, 'enviado')
  })

  it('responde 400 con un estado inválido', async () => {
    const res = await patch(1, { status: 'volando' })
    expect(res.status).toBe(400)
    expect(ordersService.updateStatus).not.toHaveBeenCalled()
  })

  it('responde 400 si el id no es un número', async () => {
    const res = await patch('abc', { status: 'enviado' })
    expect(res.status).toBe(400)
  })

  it('responde 404 si el pedido no existe', async () => {
    ordersService.updateStatus.mockResolvedValue({ error: 'not_found' })
    const res = await patch(999, { status: 'enviado' })
    expect(res.status).toBe(404)
  })

  it('responde 409 si el pedido ya estaba cancelado', async () => {
    ordersService.updateStatus.mockResolvedValue({ error: 'cancelled' })
    const res = await patch(1, { status: 'pagado' })
    expect(res.status).toBe(409)
  })

  it('responde 409 si hubo un cambio simultáneo', async () => {
    ordersService.updateStatus.mockResolvedValue({ error: 'conflict' })
    const res = await patch(1, { status: 'pagado' })
    expect(res.status).toBe(409)
  })
})

describe('GET /api/admin/stats', () => {
  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/admin/stats')
    expect(res.status).toBe(401)
  })

  it('responde 403 si el usuario es comprador', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', BUYER)
    expect(res.status).toBe(403)
  })

  it('devuelve las métricas para un admin', async () => {
    const stats = {
      totalOrders: 3,
      totalSales: 150000,
      lowStockThreshold: 5,
      lowStock: [
        { variantId: 4, productId: 2, productName: 'Aro de luz LED', variantName: '26 cm', sku: 'ARO-26', stock: 2 },
      ],
    }
    statsService.getStats.mockResolvedValue(stats)
    const res = await request(app).get('/api/admin/stats').set('Authorization', ADMIN)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(stats)
  })
})
