import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { supabase } from '../src/config/supabase.js'
import { cartService } from '../src/services/cart.service.js'
vi.mock('../src/config/supabase.js', () => ({
  supabase: { auth: { getUser: vi.fn() }, from: vi.fn() },
}))
vi.mock('../src/services/cart.service.js', () => ({
  cartService: { getCart: vi.fn(), saveCart: vi.fn(), mergeCart: vi.fn() },
}))
const MERGE = '33333333-3333-4333-8333-333333333333'
beforeEach(() => {
  vi.resetAllMocks()
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'buyer' } }, error: null })
  supabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: { id: 'buyer', role: 'comprador' }, error: null }),
      }),
    }),
  })
  cartService.saveCart.mockResolvedValue([])
  cartService.mergeCart.mockResolvedValue([])
})
describe('API del carrito', () => {
  it.each([
    ['get', '/api/cart'],
    ['put', '/api/cart'],
    ['post', '/api/cart/merge'],
  ])('exige sesión %s %s', async (method, path) => {
    expect((await request(app)[method](path)).status).toBe(401)
  })
  it('usa el usuario de la sesión y normaliza identificadores sin aceptar el precio del cliente', async () => {
    const result = await request(app)
      .put('/api/cart')
      .set('Authorization', 'Bearer buyer')
      .send({ items: [{ variantId: 2, quantity: 1, price: 0.01, user_id: 'other' }] })
    expect(result.status).toBe(200)
    expect(cartService.saveCart).toHaveBeenCalledWith('buyer', [{ variant_id: '2', quantity: 1 }])
  })
  it.each([
    {},
    { items: null },
    { items: [{ variantId: 1, quantity: 0 }] },
    { items: [{ variantId: 1, quantity: 1.5 }] },
    {
      items: [
        { variantId: 1, quantity: 1 },
        { variant_id: '1', quantity: 2 },
      ],
    },
    { items: [{ variantId: '9223372036854775808', quantity: 1 }] },
    { items: [{ variantId: 'abc', quantity: 1 }] },
    { items: [], userId: 'other' },
  ])('rechaza antes de guardar %j', async (body) => {
    expect(
      (await request(app).put('/api/cart').set('Authorization', 'Bearer buyer').send(body)).status,
    ).toBe(400)
    expect(cartService.saveCart).not.toHaveBeenCalled()
  })
  it('requiere una clave de fusión y la envía al servicio', async () => {
    const body = { items: [{ variantId: 1, quantity: 2 }] }
    expect(
      (await request(app).post('/api/cart/merge').set('Authorization', 'Bearer buyer').send(body))
        .status,
    ).toBe(400)
    expect(
      (
        await request(app)
          .post('/api/cart/merge')
          .set('Authorization', 'Bearer buyer')
          .send({ ...body, mergeId: MERGE })
      ).status,
    ).toBe(200)
    expect(cartService.mergeCart).toHaveBeenCalledWith(
      'buyer',
      [{ variant_id: '1', quantity: 2 }],
      MERGE,
    )
  })
})
