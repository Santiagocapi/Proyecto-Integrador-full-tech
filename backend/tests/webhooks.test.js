import crypto from 'node:crypto'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { supabase } from '../src/config/supabase.js'
import { getPayment } from '../src/services/mercadopago.service.js'

// env mutable: cada test decide si hay secreto de webhook configurado
const env = vi.hoisted(() => ({ NODE_ENV: 'test', CORS_ORIGIN: 'http://localhost:5173' }))
vi.mock('../src/config/env.js', () => ({ env }))
vi.mock('../src/config/supabase.js', () => ({ supabase: { from: vi.fn() } }))
vi.mock('../src/services/mercadopago.service.js', () => ({ getPayment: vi.fn() }))

const SECRET = 'secreto-de-prueba'
const PAYMENT_ID = '123456789'
const order = { id: '42', tracking_code: 'FT-ABC234', status: 'pendiente', total: '150.50' }
const approvedPayment = {
  id: 123456789,
  status: 'approved',
  external_reference: 'FT-ABC234',
  transaction_amount: 150.5,
  currency_id: 'ARS',
  date_approved: '2026-01-01T12:05:00.000-03:00',
}

let orderLookupEq
let ordersUpdate
let updateEqId
let updateEqStatus

// Mock de la tabla orders: búsqueda por tracking_code y update con doble filtro + select
function setup({ found = order, rows = [{ id: order.id }], error = null } = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: found, error: null })
  orderLookupEq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockResolvedValue({ data: error ? null : rows, error })
  updateEqStatus = vi.fn().mockReturnValue({ select })
  updateEqId = vi.fn().mockReturnValue({ eq: updateEqStatus })
  ordersUpdate = vi.fn().mockReturnValue({ eq: updateEqId })
  supabase.from.mockImplementation((table) => {
    if (table !== 'orders') throw new Error(`Tabla inesperada: ${table}`)
    return { select: () => ({ eq: orderLookupEq }), update: ordersUpdate }
  })
}

// Firma igual a la que manda Mercado Pago: HMAC-SHA256 de "id:...;request-id:...;ts:...;"
function sign({
  dataId = PAYMENT_ID,
  requestId = 'req-1',
  ts = Math.floor(Date.now() / 1000),
} = {}) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const hash = crypto.createHmac('sha256', SECRET).update(manifest).digest('hex')
  return { 'x-signature': `ts=${ts},v1=${hash}`, 'x-request-id': requestId }
}

const notify = ({ query = `type=payment&data.id=${PAYMENT_ID}`, headers = sign(), body } = {}) =>
  request(app)
    .post(`/api/webhooks/mercadopago?${query}`)
    .set(headers)
    .send(body ?? { type: 'payment', data: { id: PAYMENT_ID } })

describe('POST /api/webhooks/mercadopago', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    env.MP_WEBHOOK_SECRET = SECRET
    setup()
    getPayment.mockResolvedValue(approvedPayment)
  })

  it('ignora notificaciones que no son de pagos (200, sin consultar a MP)', async () => {
    const res = await notify({
      query: 'type=merchant_order&data.id=99',
      body: { type: 'merchant_order', data: { id: '99' } },
    })
    expect(res.status).toBe(200)
    expect(getPayment).not.toHaveBeenCalled()
  })

  it('ignora notificaciones sin id de pago (200)', async () => {
    const res = await notify({ query: 'type=payment', body: { type: 'payment' } })
    expect(res.status).toBe(200)
    expect(getPayment).not.toHaveBeenCalled()
  })

  it('acepta el formato viejo topic=payment', async () => {
    const res = await notify({ query: `topic=payment&data.id=${PAYMENT_ID}`, body: {} })
    expect(res.status).toBe(200)
    expect(getPayment).toHaveBeenCalledWith(PAYMENT_ID)
  })

  it('toma tipo e id del cuerpo si no vienen en la query', async () => {
    env.MP_WEBHOOK_SECRET = undefined
    const res = await notify({ query: '', headers: {} })
    expect(res.status).toBe(200)
    expect(getPayment).toHaveBeenCalledWith(PAYMENT_ID)
  })

  it('rechaza una firma inválida con secreto configurado (401, sin consultar a MP)', async () => {
    const res = await notify({
      headers: { 'x-signature': 'ts=1,v1=deadbeef', 'x-request-id': 'r' },
    })
    expect(res.status).toBe(401)
    expect(getPayment).not.toHaveBeenCalled()
  })

  it('rechaza una notificación sin firma con secreto configurado (401)', async () => {
    const res = await notify({ headers: {} })
    expect(res.status).toBe(401)
    expect(getPayment).not.toHaveBeenCalled()
  })

  it('rechaza una firma vieja fuera de la tolerancia de 5 minutos (401)', async () => {
    const ts = Math.floor(Date.now() / 1000) - 600
    const res = await notify({ headers: sign({ ts }) })
    expect(res.status).toBe(401)
    expect(getPayment).not.toHaveBeenCalled()
  })

  it('con firma válida procesa la notificación', async () => {
    const res = await notify()
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ received: true })
    expect(getPayment).toHaveBeenCalledWith(PAYMENT_ID)
    expect(orderLookupEq).toHaveBeenCalledWith('tracking_code', 'FT-ABC234')
  })

  it('sin secreto configurado procesa igual (desarrollo local) y avisa', async () => {
    env.MP_WEBHOOK_SECRET = undefined
    const res = await notify({ headers: {} })
    expect(res.status).toBe(200)
    expect(getPayment).toHaveBeenCalledWith(PAYMENT_ID)
    expect(console.warn).toHaveBeenCalled()
  })

  it('pago aprobado con monto correcto marca el pedido como pagado', async () => {
    const res = await notify()
    expect(res.status).toBe(200)
    expect(ordersUpdate).toHaveBeenCalledWith({
      status: 'pagado',
      paid_at: approvedPayment.date_approved,
      mp_payment_id: '123456789',
    })
    expect(updateEqId).toHaveBeenCalledWith('id', order.id)
    // Guarda de idempotencia: solo pasa de pendiente a pagado
    expect(updateEqStatus).toHaveBeenCalledWith('status', 'pendiente')
  })

  it('sin date_approved usa la fecha actual como paid_at', async () => {
    getPayment.mockResolvedValue({ ...approvedPayment, date_approved: null })
    await notify()
    const { paid_at: paidAt } = ordersUpdate.mock.calls[0][0]
    expect(Number.isNaN(Date.parse(paidAt))).toBe(false)
  })

  it('no marca pagado si el monto no coincide con el total', async () => {
    getPayment.mockResolvedValue({ ...approvedPayment, transaction_amount: 10 })
    const res = await notify()
    expect(res.status).toBe(200)
    expect(ordersUpdate).not.toHaveBeenCalled()
  })

  it('no marca pagado si la moneda no es ARS', async () => {
    getPayment.mockResolvedValue({ ...approvedPayment, currency_id: 'USD' })
    const res = await notify()
    expect(res.status).toBe(200)
    expect(ordersUpdate).not.toHaveBeenCalled()
  })

  it.each(['rejected', 'cancelled', 'pending', 'in_process'])(
    'pago %s no modifica el pedido',
    async (status) => {
      getPayment.mockResolvedValue({ ...approvedPayment, status })
      const res = await notify()
      expect(res.status).toBe(200)
      expect(ordersUpdate).not.toHaveBeenCalled()
    },
  )

  it('pedido inexistente responde 200 y no actualiza nada', async () => {
    setup({ found: null })
    const res = await notify()
    expect(res.status).toBe(200)
    expect(ordersUpdate).not.toHaveBeenCalled()
  })

  it('si Mercado Pago falla responde 5xx para que reintente', async () => {
    getPayment.mockRejectedValue(new Error('MP caído'))
    const res = await notify()
    expect(res.status).toBe(500)
  })

  it('si falla la base de datos responde 5xx', async () => {
    setup({ error: { code: '08006', message: 'conexión perdida' } })
    const res = await notify()
    expect(res.status).toBe(500)
  })

  it('pedido ya pagado (update sin filas) es un no-op con 200', async () => {
    setup({ rows: [] })
    const res = await notify()
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ received: true })
  })

  it('mp_payment_id duplicado (23505) se toma como ya procesado', async () => {
    setup({ error: { code: '23505', message: 'duplicate key' } })
    const res = await notify()
    expect(res.status).toBe(200)
  })
})
