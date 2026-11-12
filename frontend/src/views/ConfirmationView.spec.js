import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import ConfirmationView from './ConfirmationView.vue'
import { api, ApiError } from '@/services/api'
import { useCartStore } from '@/stores/cart'

const route = { params: { tracking: 'FT-ABC' }, query: {} }

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
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
}))

const order = (overrides = {}) => ({
  id: 1,
  tracking_code: 'FT-ABC',
  status: 'pendiente',
  total: 3000,
  payment_method: 'transferencia',
  created_at: '2026-11-01T10:00:00Z',
  paid_at: null,
  shipping: {
    name: 'Ana Pérez',
    address: 'Av. Siempre Viva 742',
    city: 'Córdoba',
    zip: '5000',
    phone: '3515551234',
  },
  items: [
    { variant_id: 10, product_name: 'Micrófono', variant_name: 'Único', unit_price: 1000, quantity: 1 },
    { variant_id: 11, product_name: 'Aro de luz', variant_name: 'Negro', unit_price: 2000, quantity: 1 },
  ],
  ...overrides,
})

describe('ConfirmationView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.resetAllMocks()
    route.query = {}
  })
  afterEach(() => vi.useRealTimers())

  it('muestra el pedido cargado y vacía el carrito', async () => {
    const cart = useCartStore()
    cart.items = [{ variantId: 1, name: 'x', price: 1, quantity: 1 }]
    api.get.mockResolvedValue(order())
    const wrapper = mount(ConfirmationView)
    await flushPromises()
    expect(api.get).toHaveBeenCalledWith('/orders/FT-ABC', { auth: true })
    const text = wrapper.text()
    expect(text).toContain('FT-ABC')
    expect(text).toContain('Micrófono')
    expect(text).toContain('Aro de luz')
    expect(text).toContain('Av. Siempre Viva 742')
    expect(text).toContain('Transferencia')
    expect(wrapper.find('a[href="/cuenta"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/catalogo"]').exists()).toBe(true)
    expect(cart.items).toHaveLength(0)
  })

  it('muestra "Pedido no encontrado" ante 404', async () => {
    api.get.mockRejectedValue(new ApiError(404, 'Pedido no encontrado'))
    const wrapper = mount(ConfirmationView)
    await flushPromises()
    expect(wrapper.text()).toContain('Pedido no encontrado')
  })

  it('muestra el mensaje de pago rechazado y no consulta de nuevo', async () => {
    vi.useFakeTimers()
    route.query = { status: 'rejected' }
    api.get.mockResolvedValue(order({ payment_method: 'mercadopago' }))
    const wrapper = mount(ConfirmationView)
    await flushPromises()
    expect(wrapper.text()).toContain('El pago fue rechazado')
    await vi.advanceTimersByTimeAsync(15000)
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('muestra pago aprobado si el pedido está pagado', async () => {
    api.get.mockResolvedValue(order({ status: 'pagado', payment_method: 'mercadopago' }))
    const wrapper = mount(ConfirmationView)
    await flushPromises()
    expect(wrapper.text()).toContain('¡Pago aprobado!')
  })

  it('consulta cada 3 s mientras el pago está pendiente y se detiene al pagarse', async () => {
    vi.useFakeTimers()
    route.query = { status: 'pending' }
    api.get
      .mockResolvedValueOnce(order({ payment_method: 'mercadopago' }))
      .mockResolvedValueOnce(order({ payment_method: 'mercadopago' }))
      .mockResolvedValue(order({ payment_method: 'mercadopago', status: 'pagado' }))
    const wrapper = mount(ConfirmationView)
    await flushPromises()
    expect(wrapper.text()).toContain('Estamos confirmando tu pago')
    await vi.advanceTimersByTimeAsync(3000)
    expect(api.get).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(3000)
    expect(api.get).toHaveBeenCalledTimes(3)
    expect(wrapper.text()).toContain('¡Pago aprobado!')
    await vi.advanceTimersByTimeAsync(15000)
    expect(api.get).toHaveBeenCalledTimes(3)
  })

  it('deja de consultar después de 5 reintentos', async () => {
    vi.useFakeTimers()
    api.get.mockResolvedValue(order({ payment_method: 'mercadopago' }))
    mount(ConfirmationView)
    await flushPromises()
    await vi.advanceTimersByTimeAsync(30000)
    expect(api.get).toHaveBeenCalledTimes(6)
  })

  it('cancela la consulta al desmontar', async () => {
    vi.useFakeTimers()
    api.get.mockResolvedValue(order({ payment_method: 'mercadopago' }))
    const wrapper = mount(ConfirmationView)
    await flushPromises()
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(30000)
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('pedido pendiente por transferencia muestra cómo coordinar el pago', async () => {
    vi.useFakeTimers()
    api.get.mockResolvedValue(order())
    const wrapper = mount(ConfirmationView)
    await flushPromises()
    expect(wrapper.text()).toContain('coordinar')
    await vi.advanceTimersByTimeAsync(15000)
    expect(api.get).toHaveBeenCalledTimes(1)
  })
})
