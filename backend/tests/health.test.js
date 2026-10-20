import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { app } from '../src/app.js'

describe('GET /api/health', () => {
  it('responde que la API está funcionando', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})