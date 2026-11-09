import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import CheckoutView from './CheckoutView.vue'
import { api, ApiError } from '@/services/api'
import { redirectTo } from '@/utils/redirect'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

const router = { replace: vi.fn(), push: vi.fn() }
const toast = { error: vi.fn(), success: vi.fn(), info: vi.fn(), showToast: vi.fn() }

vi.mock('@/services/api', () => {
  class ApiError extends Error {
    constructor(status, message, details) {
      super(message)
      this.status = status
      this.details = details
    }
  }
  return { ApiError, api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }
})
vi.mock('@/lib/supabase', () => ({ supabase: { auth: {} } }))
vi.mock('@/utils/redirect', () => ({ redirectTo: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))
vi.mock('vue-router', () => ({
  useRouter: () => router,
  useRoute: () => ({ params: {}, query: {} }),
}))

const cartItem = {
  variantId: 10,
  productId: 1,
  name: 'Micrófono',
  variantName: 'Único',
  price: 1000,
  image: '',
  quantity: 1,
}

const profile = {
  id: 'u1',
  full_name: 'Ana Pérez',
  address: 'Av. Siempre Viva 742',
  city: 'Córdoba',
  zip: '5000',
  phone: '3515551234',
}

const deferred = () => {
  let resolve
  const promise = new Promise((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function setup({ items = [cartItem], withProfile = true } = {}) {
  const cart = useCartStore()
  cart.items = items.map((i) => ({ ...i }))
  if (withProfile) useAuthStore().profile = profile
  const wrapper = mount(CheckoutView)
  return { wrapper, cart }
}

const confirm = (wrapper) => wrapper.findComponent({ name: 'OrderSummary' }).vm.$emit('confirm')

describe('CheckoutView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('redirige al catálogo si el carrito está vacío', async () => {
    setup({ items: [] })
    await flushPromises()
    expect(router.replace).toHaveBeenCalledWith('/catalogo')
  })

  it('con payment_url vacía el carrito y redirige a Mercado Pago', async () => {
    api.post.mockResolvedValue({
      tracking_code: 'FT-ABC',
      status: 'pendiente',
      total: 1000,
      payment_url: 'https://mp.test/pay',
    })
    const { wrapper, cart } = setup()
    confirm(wrapper)
    await flushPromises()
    expect(api.post).toHaveBeenCalledWith(
      '/orders',
      {
        shipping: {
          name: 'Ana Pérez',
          address: 'Av. Siempre Viva 742',
          city: 'Córdoba',
          zip: '5000',
          phone: '3515551234',
        },
        paymentMethod: 'mercadopago',
      },
      { auth: true },
    )
    expect(cart.items).toHaveLength(0)
    expect(redirectTo).toHaveBeenCalledWith('https://mp.test/pay')
    expect(router.push).not.toHaveBeenCalled()
  })

  it('sin payment_url vacía el carrito y navega a la confirmación', async () => {
    api.post.mockResolvedValue({
      tracking_code: 'FT-XYZ',
      status: 'pendiente',
      total: 1000,
      payment_url: null,
    })
    const { wrapper, cart } = setup()
    confirm(wrapper)
    await flushPromises()
    expect(cart.items).toHaveLength(0)
    expect(router.push).toHaveBeenCalledWith('/confirmacion/FT-XYZ')
    expect(redirectTo).not.toHaveBeenCalled()
  })

  it('no envía el pedido si el formulario de envío es inválido', async () => {
    const { wrapper } = setup({ withProfile: false })
    confirm(wrapper)
    await flushPromises()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('ante 409 muestra qué producto no tiene stock y cuántos quedan', async () => {
    api.post.mockRejectedValue(
      new ApiError(409, 'Stock insuficiente para Micrófono', {
        product_name: 'Micrófono',
        variant_name: 'Negro',
        available: 2,
        requested: 5,
      }),
    )
    const { wrapper, cart } = setup()
    confirm(wrapper)
    await flushPromises()
    const message = toast.error.mock.calls[0][0]
    expect(message).toContain('Micrófono')
    expect(message).toContain('2')
    expect(cart.items).toHaveLength(1)
  })

  it('ante 400 por carrito vacío redirige al catálogo', async () => {
    api.post.mockRejectedValue(new ApiError(400, 'El carrito está vacío'))
    const { wrapper } = setup()
    confirm(wrapper)
    await flushPromises()
    expect(toast.error).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/catalogo')
  })

  it('evita el doble envío mientras el pedido está en curso', async () => {
    const pending = deferred()
    api.post.mockReturnValue(pending.promise)
    const { wrapper } = setup()
    confirm(wrapper)
    confirm(wrapper)
    await flushPromises()
    expect(api.post).toHaveBeenCalledTimes(1)
    pending.resolve({ tracking_code: 'FT-1', payment_url: null })
    await flushPromises()
  })
})
