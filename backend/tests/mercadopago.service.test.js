import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { buildPreferenceBody, getPayment } from '../src/services/mercadopago.service.js'

vi.mock('../src/config/supabase.js', () => ({ supabase: {} }))

// env mutable para probar con y sin token, sin depender del .env local
const env = vi.hoisted(() => ({ FRONTEND_URL: 'http://localhost:5173' }))
vi.mock('../src/config/env.js', () => ({ env }))

// Solo se reemplazan los clientes HTTP del SDK; el resto queda real
const paymentGet = vi.hoisted(() => vi.fn())
vi.mock('mercadopago', async (importOriginal) => ({
  ...(await importOriginal()),
  MercadoPagoConfig: vi.fn(function (options) {
    this.options = options
  }),
  Payment: vi.fn(function () {
    return { get: paymentGet }
  }),
}))

const order = { id: '42', tracking_code: 'FT-ABC234', status: 'pendiente', total: 150.5 }
const items = [
  {
    variant_id: 7,
    product_name: 'Micrófono',
    variant_name: 'Único',
    unit_price: '50.50',
    quantity: 1,
  },
  {
    variant_id: 9,
    product_name: 'Remera',
    variant_name: 'Talle M',
    unit_price: '50.00',
    quantity: 2,
  },
]
const now = new Date('2026-01-01T12:00:00.000Z')

describe('Cuerpo de la preferencia de Mercado Pago', () => {
  it('arma ítems, referencia, pagador, back_urls y vencimiento', () => {
    const body = buildPreferenceBody(
      { order, items, payerEmail: 'andrea@test.com' },
      { frontendUrl: 'http://localhost:5173', now },
    )
    expect(body.items).toEqual([
      { id: '7', title: 'Micrófono', quantity: 1, unit_price: 50.5, currency_id: 'ARS' },
      { id: '9', title: 'Remera - Talle M', quantity: 2, unit_price: 50, currency_id: 'ARS' },
    ])
    expect(body.external_reference).toBe('FT-ABC234')
    expect(body.payer).toEqual({ email: 'andrea@test.com' })
    const url = 'http://localhost:5173/confirmacion/FT-ABC234'
    expect(body.back_urls).toEqual({ success: url, pending: url, failure: url })
    expect(body.expires).toBe(true)
    expect(body.expiration_date_to).toBe('2026-01-01T12:30:00.000Z')
    // localhost: Mercado Pago rechaza auto_return y no puede notificar
    expect(body).not.toHaveProperty('auto_return')
    expect(body).not.toHaveProperty('notification_url')
  })

  it('con https agrega auto_return y notification_url', () => {
    const body = buildPreferenceBody(
      { order, items, payerEmail: 'a@b.com' },
      { frontendUrl: 'https://tienda.com/', apiPublicUrl: 'https://api.tienda.com', now },
    )
    expect(body.auto_return).toBe('approved')
    expect(body.notification_url).toBe('https://api.tienda.com/api/webhooks/mercadopago')
    expect(body.back_urls.success).toBe('https://tienda.com/confirmacion/FT-ABC234')
  })

  it('no agrega notification_url si la API pública no es https', () => {
    const body = buildPreferenceBody(
      { order, items, payerEmail: 'a@b.com' },
      { frontendUrl: 'https://tienda.com', apiPublicUrl: 'http://localhost:3000', now },
    )
    expect(body).not.toHaveProperty('notification_url')
  })
})

describe('Consulta de un pago en Mercado Pago', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    env.MP_ACCESS_TOKEN = 'TEST-token'
  })

  it('pide el pago por id con el access token configurado', async () => {
    const payment = { id: 123, status: 'approved' }
    paymentGet.mockResolvedValue(payment)

    await expect(getPayment('123')).resolves.toEqual(payment)
    expect(MercadoPagoConfig).toHaveBeenCalledWith({ accessToken: 'TEST-token' })
    expect(Payment).toHaveBeenCalledWith(MercadoPagoConfig.mock.instances[0])
    expect(paymentGet).toHaveBeenCalledWith({ id: '123' })
  })

  it('falla con un error claro si falta MP_ACCESS_TOKEN', async () => {
    env.MP_ACCESS_TOKEN = undefined
    await expect(getPayment('123')).rejects.toThrow('MP_ACCESS_TOKEN')
    expect(paymentGet).not.toHaveBeenCalled()
  })
})
