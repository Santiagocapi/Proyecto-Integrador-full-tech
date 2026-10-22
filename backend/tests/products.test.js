import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { productsService } from '../src/services/products.service.js'

vi.mock('../src/services/products.service.js', () => ({
  productsService: {
    list: vi.fn(),
    getBySlug: vi.fn(),
  },
}))

describe('API de productos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/products', () => {
    it('rechaza un rango de precios invertido antes de consultar el servicio', async () => {
      const res = await request(app).get('/api/products').query({ minPrice: 50000, maxPrice: 1000 })

      expect(res.status).toBe(400)
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['maxPrice'] })]),
      )
      expect(productsService.list).not.toHaveBeenCalled()
    })

    it.each([
      { minPrice: 0, maxPrice: 0 },
      { minPrice: 1000, maxPrice: 1000 },
      { minPrice: 1000 },
      { maxPrice: 1000 },
    ])('acepta límites de precio válidos: %j', async (prices) => {
      productsService.list.mockResolvedValue({ items: [], total: 0, page: 1, pages: 0 })

      const res = await request(app).get('/api/products').query(prices)

      expect(res.status).toBe(200)
      expect(productsService.list).toHaveBeenCalledWith({ page: 1, limit: 10, ...prices })
    })

    it('lista productos con paginación', async () => {
      productsService.list.mockResolvedValue({
        items: [
          {
            id: 1,
            name: 'Aro de luz',
            slug: 'aro-de-luz',
            price: 25000,
          },
        ],
        total: 1,
        page: 1,
        pages: 1,
      })

      const res = await request(app).get('/api/products?page=1&limit=10')

      expect(res.status).toBe(200)
      expect(res.body.total).toBe(1)
      expect(res.body.page).toBe(1)
      expect(res.body.pages).toBe(1)
      expect(res.body.items).toHaveLength(1)

      expect(productsService.list).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      })
    })

    it('acepta filtros, búsqueda y ordenamiento', async () => {
      productsService.list.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pages: 0,
      })

      const res = await request(app).get(
        '/api/products?page=1&limit=10&category=iluminacion&minPrice=1000&maxPrice=50000&connection=usb&compat=android&q=aro&sort=price_asc',
      )

      expect(res.status).toBe(200)

      expect(productsService.list).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        category: 'iluminacion',
        minPrice: 1000,
        maxPrice: 50000,
        connection: 'usb',
        compat: 'android',
        q: 'aro',
        sort: 'price_asc',
      })
    })

    it('devuelve 400 cuando los query params son inválidos', async () => {
      const res = await request(app).get('/api/products?page=-1&limit=10')

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Parámetros de consulta inválidos')
      expect(res.body.details).toBeDefined()
      expect(productsService.list).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/products/:slug', () => {
    it('devuelve el detalle de un producto', async () => {
      productsService.getBySlug.mockResolvedValue({
        id: 1,
        name: 'Aro de luz',
        slug: 'aro-de-luz',
        price: 25000,
        product_variants: [
          {
            id: 1,
            name: 'Único',
            sku: 'ARO-001',
            stock: 10,
          },
        ],
        bundle_items: [],
      })

      const res = await request(app).get('/api/products/aro-de-luz')

      expect(res.status).toBe(200)
      expect(res.body.slug).toBe('aro-de-luz')
      expect(res.body.product_variants).toHaveLength(1)
      expect(productsService.getBySlug).toHaveBeenCalledWith('aro-de-luz')
    })

    it('devuelve 404 cuando el producto no existe', async () => {
      const error = new Error('Producto no encontrado')
      error.status = 404

      productsService.getBySlug.mockRejectedValue(error)

      const res = await request(app).get('/api/products/no-existe')

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Producto no encontrado')
    })
  })
})
