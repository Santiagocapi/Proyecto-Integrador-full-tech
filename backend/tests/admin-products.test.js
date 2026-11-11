import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { supabase } from '../src/config/supabase.js'
import { adminProductsService as service } from '../src/services/admin-products.service.js'
import { productsService } from '../src/services/products.service.js'
vi.mock('../src/services/products.service.js', () => ({
  productsService: { list: vi.fn(), getBySlug: vi.fn() },
}))

vi.mock('../src/config/supabase.js', () => ({
  supabase: { auth: { getUser: vi.fn() }, from: vi.fn() },
}))
vi.mock('../src/services/admin-products.service.js', () => ({
  adminProductsService: {
    save: vi.fn(),
    stock: vi.fn(),
    offer: vi.fn(),
    getById: vi.fn(),
    deactivate: vi.fn(),
    upload: vi.fn(),
  },
}))
const product = {
  category_id: '1',
  name: 'Micrófono',
  slug: 'microfono',
  price: 50,
  variants: [{ name: 'Único', sku: 'MIC-1', stock: 2 }],
}
function auth(role = 'admin') {
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  supabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({ single: async () => ({ data: { id: 'user-1', role }, error: null }) }),
    }),
  })
}
const routes = [
  ['get', '/api/admin/products'],
  ['get', '/api/admin/products/1'],
  ['post', '/api/admin/products'],
  ['put', '/api/admin/products/1'],
  ['delete', '/api/admin/products/1'],
  ['patch', '/api/admin/variants/1'],
  ['patch', '/api/admin/products/1'],
  ['post', '/api/admin/uploads'],
]
describe('Administración protegida por autenticación real', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    auth()
  })
  it('lista activos e inactivos con filtros validados solo para admin', async () => {
    const result = { items: [{ id: '2', active: false }], total: 1, page: 2, pages: 2 }
    productsService.list.mockResolvedValue(result)
    const res = await request(app)
      .get('/api/admin/products?page=2&limit=10&q=micro')
      .set('Authorization', 'Bearer admin')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(result)
    expect(productsService.list).toHaveBeenCalledWith(
      { page: 2, limit: 10, q: 'micro' },
      { includeInactive: true },
    )
  })
  it('rechaza paginación inválida antes de consultar el catálogo de admin', async () => {
    expect(
      (await request(app).get('/api/admin/products?page=0').set('Authorization', 'Bearer admin'))
        .status,
    ).toBe(400)
    expect(productsService.list).not.toHaveBeenCalled()
  })
  it('abre el detalle inactivo por id sin usar el catálogo público', async () => {
    service.getById.mockResolvedValue({ id: '2', active: false, product_variants: [] })
    const res = await request(app).get('/api/admin/products/2').set('Authorization', 'Bearer admin')
    expect(res.status).toBe(200)
    expect(res.body.active).toBe(false)
    expect(service.getById).toHaveBeenCalledWith('2')
  })
  it('devuelve 404 si no existe el producto de administración', async () => {
    service.getById.mockRejectedValue(
      Object.assign(new Error('Producto no encontrado'), { status: 404 }),
    )
    expect(
      (await request(app).get('/api/admin/products/2').set('Authorization', 'Bearer admin')).status,
    ).toBe(404)
  })
  it.each(routes)('rechaza sin token: %s %s', async (method, path) => {
    expect((await request(app)[method](path)).status).toBe(401)
    expect(service.save).not.toHaveBeenCalled()
    expect(service.upload).not.toHaveBeenCalled()
  })
  it.each(routes)(
    'rechaza comprador antes de validar o procesar archivos: %s %s',
    async (method, path) => {
      auth('comprador')
      expect((await request(app)[method](path).set('Authorization', 'Bearer buyer')).status).toBe(
        403,
      )
      for (const fn of Object.values(service)) expect(fn).not.toHaveBeenCalled()
    },
  )
  it('rechaza token inválido', async () => {
    supabase.auth.getUser.mockResolvedValue({ error: new Error('invalid') })
    expect(
      (
        await request(app)
          .post('/api/admin/products')
          .set('Authorization', 'Bearer invalid')
          .send(product)
      ).status,
    ).toBe(401)
  })
  it('crea con datos validados y valores predeterminados', async () => {
    service.save.mockResolvedValue({ id: '1' })
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', 'Bearer admin')
      .send(product)
    expect(res.status).toBe(201)
    expect(service.save).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ active: true, variants: product.variants, offer_price: null }),
    )
  })
  it('edita usando el id validado sin reasignar getters de Express 5', async () => {
    service.save.mockResolvedValue({ id: '2' })
    expect(
      (
        await request(app)
          .put('/api/admin/products/2')
          .set('Authorization', 'Bearer admin')
          .send(product)
      ).status,
    ).toBe(200)
    expect(service.save).toHaveBeenCalledWith('2', expect.objectContaining({ name: product.name }))
  })
  it.each([25.5, 0, null])('modifica solo la oferta del producto: %j', async (offer_price) => {
    service.offer.mockResolvedValue({ id: '2', price: 50, offer_price })
    const res = await request(app)
      .patch('/api/admin/products/2')
      .set('Authorization', 'Bearer admin')
      .send({ offer_price })
    expect(res.status).toBe(200)
    expect(service.offer).toHaveBeenCalledWith('2', { offer_price })
    expect(service.stock).not.toHaveBeenCalled()
  })
  it.each([
    {},
    { offer_price: -1 },
    { offer_price: 1.234 },
    { offer_price: '20' },
    { offer_price: 20, stock: 3 },
  ])('rechaza ofertas mal formadas %j', async (body) => {
    expect(
      (
        await request(app)
          .patch('/api/admin/products/2')
          .set('Authorization', 'Bearer admin')
          .send(body)
      ).status,
    ).toBe(400)
    expect(service.offer).not.toHaveBeenCalled()
  })
  it.each([
    { price: -1 },
    { offer_price: 51 },
    { variants: [] },
    { category_id: '0' },
    { role: 'admin' },
    { variants: [{ name: 'Único', sku: 'MIC-1', stock: -1 }] },
    { variants: [product.variants[0], product.variants[0]] },
  ])('rechaza datos inválidos %j', async (invalid) => {
    expect(
      (
        await request(app)
          .post('/api/admin/products')
          .set('Authorization', 'Bearer admin')
          .send({ ...product, ...invalid })
      ).status,
    ).toBe(400)
    expect(service.save).not.toHaveBeenCalled()
  })
  it.each(['0', '-1', 'abc', '9223372036854775808'])('rechaza id %s', async (id) => {
    expect(
      (await request(app).delete(`/api/admin/products/${id}`).set('Authorization', 'Bearer admin'))
        .status,
    ).toBe(400)
    expect(service.deactivate).not.toHaveBeenCalled()
  })
  it('da baja lógica', async () => {
    service.deactivate.mockResolvedValue({ id: '1', active: false })
    const res = await request(app)
      .delete('/api/admin/products/1')
      .set('Authorization', 'Bearer admin')
    expect(res.body.active).toBe(false)
    expect(service.deactivate).toHaveBeenCalledWith('1')
  })
  it('actualiza stock y rechaza precios inexistentes en variantes', async () => {
    service.stock.mockResolvedValue({ id: '1', stock: 0 })
    expect(
      (
        await request(app)
          .patch('/api/admin/variants/1')
          .set('Authorization', 'Bearer admin')
          .send({ stock: 0 })
      ).status,
    ).toBe(200)
    expect(
      (
        await request(app)
          .patch('/api/admin/variants/1')
          .set('Authorization', 'Bearer admin')
          .send({ stock: 1, offer_price: 2 })
      ).status,
    ).toBe(400)
    expect(service.stock).toHaveBeenCalledTimes(1)
  })
  it.each([404, 409, 503])('propaga error del servicio %s', async (status) => {
    service.save.mockRejectedValue(Object.assign(new Error('Error de operación'), { status }))
    expect(
      (
        await request(app)
          .post('/api/admin/products')
          .set('Authorization', 'Bearer admin')
          .send(product)
      ).status,
    ).toBe(status)
  })
  it('sube un único archivo', async () => {
    service.upload.mockResolvedValue({ url: 'https://example.com/image.png' })
    const res = await request(app)
      .post('/api/admin/uploads')
      .set('Authorization', 'Bearer admin')
      .attach('file', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'image.png')
    expect(res.status).toBe(201)
    expect(service.upload).toHaveBeenCalledOnce()
  })
  it('rechaza imagen mayor a 2 MB antes de subirla', async () => {
    const res = await request(app)
      .post('/api/admin/uploads')
      .set('Authorization', 'Bearer admin')
      .attach('file', Buffer.alloc(2 * 1024 * 1024 + 1), 'image.png')
    expect(res.status).toBe(413)
    expect(service.upload).not.toHaveBeenCalled()
  })
  it('rechaza solicitud sin archivo', async () => {
    expect(
      (await request(app).post('/api/admin/uploads').set('Authorization', 'Bearer admin')).status,
    ).toBe(400)
  })
})
