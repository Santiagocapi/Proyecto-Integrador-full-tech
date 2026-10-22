import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { categoriesService } from '../src/services/categories.service.js'

vi.mock('../src/services/categories.service.js', () => ({
  categoriesService: { list: vi.fn() },
}))

describe('GET /api/categories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('devuelve las categorías del servicio', async () => {
    const categories = [{ id: 1, name: 'Iluminación', slug: 'iluminacion' }]
    categoriesService.list.mockResolvedValue(categories)
    const res = await request(app).get('/api/categories')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(categories)
  })

  it('devuelve un array vacío cuando no hay categorías', async () => {
    categoriesService.list.mockResolvedValue([])
    const res = await request(app).get('/api/categories')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})
