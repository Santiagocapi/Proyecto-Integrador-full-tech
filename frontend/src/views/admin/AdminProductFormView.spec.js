import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AdminProductFormView from './AdminProductFormView.vue'
import { api } from '@/services/api'

const { route, push } = vi.hoisted(() => ({ route: { params: {} }, push: vi.fn() }))
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push }),
  RouterLink: { template: '<a><slot /></a>' },
}))
vi.mock('@/services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  route.params = { id: '3', slug: 'microfono' }
  api.get.mockImplementation(async (path) =>
    path === '/categories'
      ? [{ id: 1, name: 'Audio' }]
      : {
          id: 3,
          name: 'Micrófono',
          slug: 'microfono',
          description: 'Micrófono USB',
          price: 100,
          categories: { id: 1 },
          product_variants: [{ id: 7, name: 'Único', sku: 'MIC-7', stock: 2 }],
          images: ['https://example.com/original.png'],
        },
  )
})

describe('Formulario de productos con el contrato real de la API', () => {
  it('crea un producto con categoría numérica del selector y datos válidos para el backend', async () => {
    route.params = {}
    const wrapper = mount(AdminProductFormView)
    await flushPromises()
    const field = (text) =>
      wrapper.findAll('label').find((label) => label.text().trim().startsWith(text))
    await field('Nombre').get('input').setValue('Producto nuevo')
    await field('Categoría').get('select').setValue('1')
    await field('Descripción').get('textarea').setValue('Descripción del producto')
    await field('Precio normal').get('input').setValue('100')
    await field('SKU').get('input').setValue('NEW-1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.post).toHaveBeenCalledOnce()
    const [path, payload] = api.post.mock.calls[0]
    expect(path).toBe('/admin/products')
    expect(payload.category_id).toBe('1')
    expect(payload.price).toBe(100)
    expect(payload.variants[0]).not.toHaveProperty('id')
    wrapper.unmount()
  })

  it('conserva categoría, imagen y variantes existentes y envía una edición válida', async () => {
    const wrapper = mount(AdminProductFormView)
    await flushPromises()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.put).toHaveBeenCalledOnce()
    const [path, payload] = api.put.mock.calls[0]
    expect(path).toBe('/admin/products/3')
    expect(payload.category_id).toBe('1')
    expect(payload.variants).toEqual([{ id: '7', name: 'Único', sku: 'MIC-7', stock: 2 }])
    expect(payload.images).toEqual(['https://example.com/original.png'])
    expect(payload.price).toBe(100)
    wrapper.unmount()
  })
})
