import { describe, expect, it, vi } from 'vitest'
import { buildPreferenceBody } from '../src/services/mercadopago.service.js'

vi.mock('../src/config/supabase.js', () => ({ supabase: {} }))

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
