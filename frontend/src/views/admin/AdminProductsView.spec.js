import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AdminProductsView from './AdminProductsView.vue'
import { api } from '@/services/api'
const { success, error } = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/services/api', () => ({ api: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
vi.mock('@/composables/useToast', () => ({ useToast: () => ({ success, error }) }))
vi.mock('vue-router', () => ({ RouterLink: { template: '<a><slot /></a>' } }))
beforeEach(() => {
  vi.resetAllMocks()
  api.get.mockResolvedValue({
    items: [
      {
        id: '2',
        name: 'Micro',
        slug: 'micro',
        price: '100',
        offer_price: '80',
        categories: { name: 'Audio' },
        product_variants: [
          { id: '7', name: 'USB', stock: 3 },
          { id: '8', name: 'XLR', stock: 4 },
        ],
      },
    ],
    total: 1,
    page: 1,
    pages: 1,
  })
  api.patch.mockResolvedValue({})
})
async function setup() {
  const wrapper = mount(AdminProductsView, { global: { stubs: { BaseModal: true } } })
  await flushPromises()
  return wrapper
}
describe('Edición en línea de stock y oferta', () => {
  it('consulta el listado protegido y muestra también los productos dados de baja', async () => {
    const wrapper = await setup()
    expect(api.get).toHaveBeenCalledWith('/admin/products?page=1&limit=10', { auth: true })
    expect(wrapper.text()).toContain('Dado de baja')
    wrapper.unmount()
  })
  it('no marca la oferta como modificada por recibir un decimal como texto', async () => {
    const wrapper = await setup()
    expect(wrapper.findAll('button').filter((b) => b.text() === 'Guardar')).toHaveLength(0)
    wrapper.unmount()
  })
  it.each([
    ['60', 60],
    ['', null],
    ['0', 0],
  ])('guarda la oferta %s en el producto, sin modificar variantes', async (input, expected) => {
    const wrapper = await setup()
    await wrapper.get('input[aria-label="Precio de oferta de Micro"]').setValue(input)
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Guardar')
      .trigger('click')
    await flushPromises()
    expect(api.patch).toHaveBeenCalledExactlyOnceWith(
      '/admin/products/2',
      { offer_price: expected },
      { auth: true },
    )
    expect(success).toHaveBeenCalledWith('Precio de oferta actualizado.')
    expect(wrapper.findAll('button').filter((b) => b.text() === 'Guardar')).toHaveLength(0)
    wrapper.unmount()
  })
  it('actualiza solo el stock de la variante elegida', async () => {
    const wrapper = await setup()
    await wrapper.get('input[aria-label="Stock de Micro, variante XLR"]').setValue('9')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Guardar')
      .trigger('click')
    await flushPromises()
    expect(api.patch).toHaveBeenCalledExactlyOnceWith(
      '/admin/variants/8',
      { stock: 9 },
      { auth: true },
    )
    expect(success).toHaveBeenCalledWith('Stock actualizado.')
    wrapper.unmount()
  })
  it.each(['', '-1', '1.5'])('rechaza stock vacío o inválido: %s', async (value) => {
    const wrapper = await setup()
    await wrapper.get('input[aria-label="Stock de Micro, variante USB"]').setValue(value)
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Guardar')
      .trigger('click')
    expect(api.patch).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalled()
    wrapper.unmount()
  })
  it('rechaza una oferta superior al precio sin mandar la petición', async () => {
    const wrapper = await setup()
    await wrapper.get('input[aria-label="Precio de oferta de Micro"]').setValue('101')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Guardar')
      .trigger('click')
    expect(api.patch).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalled()
    wrapper.unmount()
  })
  it('muestra el error del servidor y mantiene el botón para reintentar', async () => {
    api.patch.mockRejectedValue(new Error('Sin conexión'))
    const wrapper = await setup()
    await wrapper.get('input[aria-label="Precio de oferta de Micro"]').setValue('60')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Guardar')
      .trigger('click')
    await flushPromises()
    expect(error).toHaveBeenCalledWith('Sin conexión')
    expect(
      wrapper
        .findAll('button')
        .find((b) => b.text() === 'Guardar')
        .attributes('disabled'),
    ).toBeUndefined()
    wrapper.unmount()
  })
})
