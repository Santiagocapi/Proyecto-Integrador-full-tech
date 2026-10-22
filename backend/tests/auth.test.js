import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { app } from '../src/app.js'
import { requireAuth, requireRole } from '../src/middlewares/auth.js'
import { supabase } from '../src/config/supabase.js'

vi.mock('../src/config/supabase.js', () => ({
  supabase: {
    auth: {
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn()
      },
      getUser: vi.fn()
    },
    from: vi.fn()
  }
}))

describe('Auth Endpoints y Middlewares', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('responde 400 si los datos de registro son inválidos', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'correo-invalido',
      password: '123',
      full_name: 'R'
    })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body).toHaveProperty('details')
  })

  it('responde 201 al registrar un usuario válido con rol comprador', async () => {
    supabase.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'uuid-123', email: 'rocio@test.com' } },
      error: null
    })

    supabase.from.mockReturnValue({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'uuid-123', full_name: 'Rocio Lucero', role: 'comprador' },
            error: null
          })
        })
      })
    })

    const res = await request(app).post('/api/auth/register').send({
      email: 'rocio@test.com',
      password: 'Password123',
      full_name: 'Rocio Lucero',
      phone: '+5492604123456'
    })

    expect(res.status).toBe(201)
    expect(res.body.profile.role).toBe('comprador')
  })

  it('responde 409 si el email ya está registrado', async () => {
    supabase.auth.admin.createUser.mockResolvedValue({
      data: null,
      error: { message: 'User already registered', status: 422 }
    })

    const res = await request(app).post('/api/auth/register').send({
      email: 'duplicado@test.com',
      password: 'Password123',
      full_name: 'Rocio Lucero',
      phone: '+5492604123456'
    })

    expect(res.status).toBe(409)
  })

  it('responde 401 en GET /api/auth/me si no se envía token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('responde 403 cuando un comprador intenta entrar a una ruta de admin', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'uuid-123', email: 'rocio@test.com' } },
      error: null
    })

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'uuid-123', full_name: 'Rocio', role: 'comprador' },
            error: null
          })
        })
      })
    })

    const testApp = express()
    testApp.get('/admin-test', requireAuth, requireRole('admin'), (req, res) => {
      res.status(200).json({ ok: true })
    })

    const res = await request(testApp)
      .get('/admin-test')
      .set('Authorization', 'Bearer token-valido')

    expect(res.status).toBe(403)
  })
})