import { describe, it, expect, vi, beforeEach } from 'vitest'
import { effectScope, ref, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { api } from '@/services/api'
import { useProducts } from './useProducts'

vi.mock('@/services/api', () => ({ api: { get: vi.fn() } }))

describe('Paginación del catálogo', () => {
  beforeEach(() => vi.resetAllMocks())

  it('reintentar una página no duplica productos y cambiar filtros limpia los anteriores', async () => {
    api.get.mockResolvedValueOnce({ items: [{ slug: 'a' }], total: 2, pages: 2 })
    const filters = ref({ page: 1, q: '' })
    const scope = effectScope()
    const result = scope.run(() => useProducts(filters))
    await flushPromises()
    api.get.mockResolvedValue({ items: [{ slug: 'b' }], total: 2, pages: 2 })
    filters.value = { page: 2, q: '' }
    await nextTick()
    await flushPromises()
    await result.refetch()
    expect(result.products.value.map((p) => p.slug)).toEqual(['a', 'b'])
    api.get.mockRejectedValueOnce(new Error('Sin conexión'))
    filters.value = { page: 1, q: 'nuevo' }
    await nextTick()
    await flushPromises()
    expect(result.products.value).toEqual([])
    expect(result.error.value).toBe('Sin conexión')
    scope.stop()
  })

  it('descarta respuestas anteriores al cambiar los filtros', async () => {
    let resolveOld
    api.get.mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve }))
    const filters = ref({ page: 1, q: 'anterior' })
    const scope = effectScope()
    const result = scope.run(() => useProducts(filters))
    api.get.mockResolvedValueOnce({ items: [{ slug: 'nuevo' }], total: 1, pages: 1 })
    filters.value = { page: 1, q: 'nuevo' }
    await nextTick()
    await flushPromises()
    resolveOld({ items: [{ slug: 'anterior' }], total: 1, pages: 1 })
    await flushPromises()
    expect(result.products.value).toEqual([{ slug: 'nuevo' }])
    scope.stop()
  })
})
