import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { supabase } from '../src/config/supabase.js'
import { createPreference } from '../src/services/mercadopago.service.js'

vi.mock('../src/config/supabase.js', () => ({
  supabase: { auth: { getUser: vi.fn() }, from: vi.fn(), rpc: vi.fn() },
}))
vi.mock('../src/services/mercadopago.service.js', () => ({ createPreference: vi.fn() }))

const USER_ID = '123e4567-e89b-12d3-a456-426614174000'
const shipping = {
  name: '  Andrea Tests ',
  address: 'San Lorenzo 456',
  city: 'San Rafael',
  zip: '5600',
  phone: '2614987512',
}
const createdOrder = { id: '42', tracking_code: 'FT-ABC234', status: 'pendiente', total: 150.5 }
const orderItems = [
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

let ordersUpdate
let ordersEq
let rpcResults

// Arma los mocks de Supabase: auth real con perfil, tablas y funciones RPC por nombre.
function setup({ createOrder, cancelOrder = { data: true, error: null } } = {}) {
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: USER_ID, email: 'andrea@test.com' } },
    error: null,
  })
  ordersEq = vi.fn().mockResolvedValue({ error: null })
  ordersUpdate = vi.fn().mockReturnValue({ eq: ordersEq })
  supabase.from.mockImplementation((table) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { id: USER_ID, role: 'comprador' }, error: null }),
          }),
        }),
      }
    }
    if (table === 'order_items') {
      return { select: () => ({ eq: async () => ({ data: orderItems, error: null }) }) }
    }
    if (table === 'orders') return { update: ordersUpdate }
    throw new Error(`Tabla inesperada: ${table}`)
  })
  rpcResults = {
    create_order: createOrder ?? { data: createdOrder, error: null },
    cancel_order: cancelOrder,
  }
  supabase.rpc.mockImplementation(async (fn) => rpcResults[fn])
}

const post = (body) =>
  request(app).post('/api/orders').set('Authorization', 'Bearer token').send(body)

describe('POST /api/orders', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setup()
  })

  it('rechaza sin token (401)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ shipping, paymentMethod: 'mercadopago' })
    expect(res.status).toBe(401)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it.each([
    ['sin envío', { paymentMethod: 'efectivo' }],
    ['método inválido', { shipping, paymentMethod: 'bitcoin' }],
    ['nombre vacío', { shipping: { ...shipping, name: '   ' }, paymentMethod: 'efectivo' }],
    ['código postal inválido', { shipping: { ...shipping, zip: '12' }, paymentMethod: 'efectivo' }],
    ['teléfono inválido', { shipping: { ...shipping, phone: 'abc' }, paymentMethod: 'efectivo' }],
  ])('rechaza cuerpo inválido: %s (400)', async (_, body) => {
    const res = await post(body)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Datos de entrada inválidos')
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('acepta código postal CPA', async () => {
    const res = await post({
      shipping: { ...shipping, zip: 'm5600abc' },
      paymentMethod: 'efectivo',
    })
    expect(res.status).toBe(201)
    expect(supabase.rpc.mock.calls[0][1].p_shipping.zip).toBe('M5600ABC')
  })

  it('carrito vacío (FT001) responde 400', async () => {
    setup({
      createOrder: { data: null, error: { code: 'FT001', message: 'El carrito está vacío' } },
    })
    const res = await post({ shipping, paymentMethod: 'efectivo' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('El carrito está vacío')
  })

  it('stock insuficiente (FT002) responde 409 con detalle parseado', async () => {
    const detail = {
      variant_id: '7',
      product_name: 'Micrófono',
      variant_name: 'Único',
      available: 1,
      requested: 3,
    }
    setup({
      createOrder: {
        data: null,
        error: {
          code: 'FT002',
          message: 'Stock insuficiente para Micrófono',
          details: JSON.stringify(detail),
        },
      },
    })
    const res = await post({ shipping, paymentMethod: 'mercadopago' })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: 'Stock insuficiente para Micrófono', details: detail })
    expect(createPreference).not.toHaveBeenCalled()
  })

  it('otro error de la base responde 500', async () => {
    setup({ createOrder: { data: null, error: { code: '23514', message: 'check' } } })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await post({ shipping, paymentMethod: 'efectivo' })
    expect(res.status).toBe(500)
  })

  it('mercadopago: crea la preferencia, guarda su id y devuelve payment_url (201)', async () => {
    createPreference.mockResolvedValue({ id: 'pref-1', init_point: 'https://mp.test/pay/pref-1' })
    const res = await post({ shipping, paymentMethod: 'mercadopago' })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      tracking_code: 'FT-ABC234',
      status: 'pendiente',
      total: 150.5,
      payment_url: 'https://mp.test/pay/pref-1',
    })
    expect(supabase.rpc).toHaveBeenCalledWith('create_order', {
      p_user_id: USER_ID,
      p_shipping: { ...shipping, name: 'Andrea Tests' },
      p_payment_method: 'mercadopago',
    })
    expect(createPreference).toHaveBeenCalledExactlyOnceWith({
      order: createdOrder,
      items: orderItems,
      payerEmail: 'andrea@test.com',
    })
    expect(ordersUpdate).toHaveBeenCalledWith({ mp_preference_id: 'pref-1' })
    expect(ordersEq).toHaveBeenCalledWith('id', '42')
  })

  it('transferencia: payment_url null y nunca llama a Mercado Pago (201)', async () => {
    const res = await post({ shipping, paymentMethod: 'transferencia' })
    expect(res.status).toBe(201)
    expect(res.body.payment_url).toBeNull()
    expect(res.body.tracking_code).toBe('FT-ABC234')
    expect(createPreference).not.toHaveBeenCalled()
    expect(ordersUpdate).not.toHaveBeenCalled()
  })

  it('si falla Mercado Pago cancela el pedido y responde 502', async () => {
    createPreference.mockRejectedValue(new Error('MP caído'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await post({ shipping, paymentMethod: 'mercadopago' })

    expect(res.status).toBe(502)
    expect(res.body.error).toBe('No se pudo iniciar el pago con Mercado Pago')
    expect(supabase.rpc).toHaveBeenCalledWith('cancel_order', { p_order_id: '42' })
    expect(ordersUpdate).not.toHaveBeenCalled()
  })
})
