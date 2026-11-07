import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { supabase } from '../src/config/supabase.js'

vi.mock('../src/config/supabase.js', () => ({
  supabase: { auth: { getUser: vi.fn() }, from: vi.fn(), rpc: vi.fn() },
}))

const USER_ID = '123e4567-e89b-12d3-a456-426614174000'
const OTHER_ID = '987e6543-e21b-12d3-a456-426614174999'

// Fila tal como la devuelve PostgREST (numeric como string, bigint como número)
const dbOrder = (overrides = {}) => ({
  id: 42,
  user_id: USER_ID,
  tracking_code: 'FT-ABC234',
  status: 'pendiente',
  total: '150.50',
  payment_method: 'mercadopago',
  shipping_name: 'Andrea Tests',
  shipping_address: 'San Lorenzo 456',
  shipping_city: 'San Rafael',
  shipping_zip: '5600',
  shipping_phone: '2614987512',
  mp_preference_id: 'pref-1',
  mp_payment_id: 'pay-1',
  paid_at: null,
  created_at: '2026-11-01T10:00:00Z',
  order_items: [
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
  ],
  ...overrides,
})

const mappedOrder = {
  id: '42',
  tracking_code: 'FT-ABC234',
  status: 'pendiente',
  total: 150.5,
  payment_method: 'mercadopago',
  created_at: '2026-11-01T10:00:00Z',
  paid_at: null,
  shipping: {
    name: 'Andrea Tests',
    address: 'San Lorenzo 456',
    city: 'San Rafael',
    zip: '5600',
    phone: '2614987512',
  },
  items: [
    {
      variant_id: '7',
      product_name: 'Micrófono',
      variant_name: 'Único',
      unit_price: 50.5,
      quantity: 1,
    },
    {
      variant_id: '9',
      product_name: 'Remera',
      variant_name: 'Talle M',
      unit_price: 50,
      quantity: 2,
    },
  ],
}

// Query builder encadenable de PostgREST: registra las llamadas y resuelve con `result`
function queryBuilder(result) {
  const calls = []
  const builder = {
    calls,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  for (const method of ['select', 'eq', 'order', 'maybeSingle', 'single']) {
    builder[method] = (...args) => {
      calls.push([method, ...args])
      return builder
    }
  }
  return builder
}

let ordersQuery

// Arma los mocks: usuario autenticado con el rol indicado y la tabla orders con `ordersResult`
function setup({ role = 'comprador', ordersResult = { data: [], error: null } } = {}) {
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: USER_ID, email: 'andrea@test.com' } },
    error: null,
  })
  ordersQuery = queryBuilder(ordersResult)
  supabase.from.mockImplementation((table) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { id: USER_ID, role }, error: null }),
          }),
        }),
      }
    }
    if (table === 'orders') return ordersQuery
    throw new Error(`Tabla inesperada: ${table}`)
  })
}

const callsOf = (method) => ordersQuery.calls.filter(([name]) => name === method)

describe('GET /api/me/orders', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setup()
  })

  it('rechaza sin token (401)', async () => {
    const res = await request(app).get('/api/me/orders')
    expect(res.status).toBe(401)
  })

  it('devuelve los pedidos del usuario mapeados, del más nuevo al más viejo', async () => {
    const newer = dbOrder({ id: 43, tracking_code: 'FT-NEW234', created_at: '2026-11-02T10:00:00Z' })
    setup({ ordersResult: { data: [newer, dbOrder()], error: null } })

    const res = await request(app).get('/api/me/orders').set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(2)
    expect(res.body[0]).toMatchObject({ id: '43', tracking_code: 'FT-NEW234' })
    expect(res.body[1]).toEqual(mappedOrder)
    for (const order of res.body) {
      expect(order).not.toHaveProperty('user_id')
      expect(order).not.toHaveProperty('mp_preference_id')
      expect(order).not.toHaveProperty('mp_payment_id')
      expect(order).not.toHaveProperty('order_items')
    }
    expect(callsOf('eq')).toContainEqual(['eq', 'user_id', USER_ID])
    expect(callsOf('order')).toContainEqual(['order', 'created_at', { ascending: false }])
    expect(callsOf('select')[0][1]).toMatch(/order_items\s*\(/)
  })

  it('devuelve un array vacío si no tiene pedidos', async () => {
    setup({ ordersResult: { data: [], error: null } })
    const res = await request(app).get('/api/me/orders').set('Authorization', 'Bearer token')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('error de la base responde 500', async () => {
    setup({ ordersResult: { data: null, error: { code: 'XX000', message: 'boom' } } })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await request(app).get('/api/me/orders').set('Authorization', 'Bearer token')
    expect(res.status).toBe(500)
  })
})

describe('GET /api/orders/:tracking', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setup()
  })

  const get = (tracking) =>
    request(app).get(`/api/orders/${tracking}`).set('Authorization', 'Bearer token')

  it('rechaza sin token (401)', async () => {
    const res = await request(app).get('/api/orders/FT-ABC234')
    expect(res.status).toBe(401)
  })

  it.each(['ABC234', 'FT-ABC23', 'FT-ABC2345', 'FT_ABC234', 'FT-AB$234'])(
    'rechaza formato inválido %s (400)',
    async (tracking) => {
      const res = await get(tracking)
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Datos de entrada inválidos')
      expect(callsOf('select')).toHaveLength(0)
    },
  )

  it('responde 404 si el pedido no existe', async () => {
    setup({ ordersResult: { data: null, error: null } })
    const res = await get('FT-ABC234')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Pedido no encontrado')
  })

  it('responde 404 si el pedido es de otro comprador', async () => {
    setup({ ordersResult: { data: dbOrder({ user_id: OTHER_ID }), error: null } })
    const res = await get('FT-ABC234')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Pedido no encontrado')
  })

  it('devuelve el pedido mapeado a su dueño (200)', async () => {
    setup({ ordersResult: { data: dbOrder(), error: null } })
    const res = await get('FT-ABC234')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(mappedOrder)
    expect(callsOf('eq')).toContainEqual(['eq', 'tracking_code', 'FT-ABC234'])
  })

  it('un admin puede ver el pedido de otro usuario (200)', async () => {
    setup({ role: 'admin', ordersResult: { data: dbOrder({ user_id: OTHER_ID }), error: null } })
    const res = await get('FT-ABC234')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(mappedOrder)
  })

  it('acepta el código en minúsculas', async () => {
    setup({ ordersResult: { data: dbOrder(), error: null } })
    const res = await get('ft-abc234')
    expect(res.status).toBe(200)
    expect(callsOf('eq')).toContainEqual(['eq', 'tracking_code', 'FT-ABC234'])
  })
})
