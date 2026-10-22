import { beforeEach, describe, expect, it, vi } from 'vitest'
import { productsService } from '../src/services/products.service.js'

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))

vi.mock('../src/config/supabase.js', async () => {
  const { createClient } = await import('@supabase/supabase-js')
  return {
    supabase: createClient('https://catalog.example.com', 'test-key', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetchMock },
    }),
  }
})

function respond(data, { status = 200, count = 0 } = {}) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json', 'Content-Range': `0-0/${count}` },
    }),
  )
}

function requestedUrl(index = 0) {
  return new URL(fetchMock.mock.calls[index][0])
}

describe('Servicio de productos con transporte simulado', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('envía filtros, paginación y orden al cliente de Supabase', async () => {
    respond([{ id: 1 }], { count: 21 })
    const result = await productsService.list({
      page: 2,
      limit: 10,
      category: 'iluminacion',
      minPrice: 0,
      maxPrice: 50000,
      connection: 'usb',
      compat: 'android',
      sort: 'price_asc',
    })

    const params = requestedUrl().searchParams
    expect(params.get('active')).toBe('eq.true')
    expect(params.get('categories.slug')).toBe('eq.iluminacion')
    expect(params.getAll('price')).toEqual(['gte.0', 'lte.50000'])
    expect(params.get('connection_type')).toBe('ilike.usb')
    expect(params.get('compatibility')).toBe('cs.{android}')
    expect(params.get('order')).toBe('price.asc,id.asc')
    expect(params.get('offset')).toBe('10')
    expect(params.get('limit')).toBe('10')
    expect(result).toEqual({ items: [{ id: 1 }], total: 21, page: 2, pages: 3 })
  })

  it.each([
    ['price_asc', 'price.asc,id.asc'],
    ['price_desc', 'price.desc,id.asc'],
    ['newest', 'created_at.desc,id.asc'],
    [undefined, 'id.asc'],
  ])('ordena de forma determinista con sort=%s', async (sort, order) => {
    respond([])
    await productsService.list({ sort })
    expect(requestedUrl().searchParams.get('order')).toBe(order)
  })

  it.each([
    ['aro', '(name.ilike."%aro%",description.ilike."%aro%")'],
    ['aro,kit(usb)', '(name.ilike."%aro,kit(usb)%",description.ilike."%aro,kit(usb)%")'],
    ['aro"', String.raw`(name.ilike."%aro\"%",description.ilike."%aro\"%")`],
    ['aro\\', String.raw`(name.ilike."%aro\\%",description.ilike."%aro\\%")`],
  ])('mantiene la búsqueda %j dentro de valores entre comillas', async (q, expected) => {
    respond([])
    await productsService.list({ q })
    expect(requestedUrl().searchParams.get('or')).toBe(expected)
  })

  it('propaga los errores de permisos del catálogo', async () => {
    respond({ code: '42501', message: 'permission denied for table products' }, { status: 403 })
    await expect(productsService.list({})).rejects.toMatchObject({ code: '42501' })
  })

  it('devuelve 404 cuando Supabase no encuentra un producto activo', async () => {
    respond([])
    await expect(productsService.getBySlug('inexistente')).rejects.toMatchObject({ status: 404 })
    expect(requestedUrl().searchParams.get('active')).toBe('eq.true')
    expect(requestedUrl().searchParams.get('slug')).toBe('eq.inexistente')
  })

  it('incluye los componentes de un Starter Pack', async () => {
    respond({ id: 7, slug: 'kit', is_bundle: true, product_variants: [] })
    const components = [{ quantity: 2, product: { id: 3, slug: 'aro' } }]
    respond(components)

    const result = await productsService.getBySlug('kit')

    expect(result.bundle_items).toEqual(components)
    expect(requestedUrl(1).pathname).toBe('/rest/v1/bundle_items')
    expect(requestedUrl(1).searchParams.get('bundle_id')).toBe('eq.7')
  })

  it('devuelve una página vacía conservando el total y la página solicitada', async () => {
    respond([], { count: 21 })
    const result = await productsService.list({ page: 4, limit: 10 })
    expect(result).toEqual({ items: [], total: 21, page: 4, pages: 3 })
  })

  it('devuelve cero páginas cuando el catálogo no tiene coincidencias', async () => {
    respond([])
    expect(await productsService.list({})).toEqual({ items: [], total: 0, page: 1, pages: 0 })
  })

  it('no consulta componentes para un producto común y conserva sus variantes', async () => {
    const product = { id: 3, is_bundle: false, product_variants: [{ id: 4, stock: 0 }] }
    respond(product)
    expect(await productsService.getBySlug('aro')).toEqual({ ...product, bundle_items: [] })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('no convierte un error de permisos del detalle en un producto inexistente', async () => {
    respond({ code: '42501', message: 'permission denied for table products' }, { status: 403 })
    await expect(productsService.getBySlug('kit')).rejects.toMatchObject({ code: '42501' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rechaza el detalle completo si no puede leer los componentes del pack', async () => {
    respond({ id: 7, is_bundle: true })
    respond({ code: '42501', message: 'permission denied for table bundle_items' }, { status: 403 })
    await expect(productsService.getBySlug('kit')).rejects.toMatchObject({ code: '42501' })
  })
})
