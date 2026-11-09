import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cartService } from '../src/services/cart.service.js'
import { supabase } from '../src/config/supabase.js'
vi.mock('../src/config/supabase.js', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))
beforeEach(() => {
  vi.resetAllMocks()
  supabase.rpc.mockResolvedValue({ error: null })
  supabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        order: async () => ({
          data: [
            {
              variant_id: '9007199254740993',
              quantity: 2,
              product_variants: {
                name: 'USB',
                stock: 3,
                products: {
                  id: '2',
                  name: 'Micro',
                  active: true,
                  price: 20,
                  offer_price: 10,
                  images: ['https://example.com/a.png'],
                },
              },
            },
          ],
          error: null,
        }),
      }),
    }),
  })
})
describe('Servicio del carrito', () => {
  it('usa una RPC atómica y devuelve stock, precio del servidor e identificadores sin redondear', async () => {
    const data = await cartService.saveCart('A', [{ variant_id: '9007199254740993', quantity: 2 }])
    expect(supabase.rpc).toHaveBeenCalledWith('save_cart', {
      p_user_id: 'A',
      p_items: [{ variant_id: '9007199254740993', quantity: 2 }],
      p_merge_id: null,
    })
    expect(data[0]).toMatchObject({ variantId: '9007199254740993', stock: 3, price: 10 })
  })
  it.each([
    ['FT003', 409],
    ['FT004', 400],
    ['PGRST202', 503],
  ])('traduce %s sin intentar un segundo guardado', async (code, status) => {
    supabase.rpc.mockResolvedValue({ error: { code, message: 'No se pudo guardar' } })
    await expect(cartService.saveCart('A', [])).rejects.toMatchObject({ status })
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
