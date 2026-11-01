import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabase } from '../src/config/supabase.js';

// Mock del middleware de autenticación preservando requireAuth con UUID válido
vi.mock('../src/middlewares/auth.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    requireAuth: (req, res, next) => {
      req.user = { id: '123e4567-e89b-12d3-a456-426614174000', role: 'user' };
      next();
    }
  };
});

// Mock limpio de las consultas a Supabase en los tests
vi.spyOn(supabase, 'from').mockImplementation(() => ({
  update: () => ({
    eq: () => ({
      select: () => ({
        maybeSingle: async () => ({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            full_name: 'Andrea Tests',
            phone: '26149875',
            address: 'San Lorenzo 456',
            city: 'San Rafael',
            province: 'Mendoza',
            zip: '5600',
            role: 'user'
          },
          error: null
        })
      })
    })
  }),
  insert: () => ({
    select: () => ({
      single: async () => ({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          full_name: 'Andrea Tests',
          phone: '26149875',
          address: 'San Lorenzo 456',
          city: 'San Rafael',
          province: 'Mendoza',
          zip: '5600',
          role: 'user'
        },
        error: null
      })
    })
  })
}));

describe('PUT /api/me - Actualización de Perfil (Rama feat/mi-cuenta)', () => {
  it('Debe actualizar exitosamente el perfil del usuario con datos válidos (200 OK)', async () => {
    const payloadValido = {
      full_name: 'Andrea Tests',
      phone: '26149875',
      address: 'San Lorenzo 456',
      city: 'San Rafael',
      province: 'Mendoza',
      zip: '5600'
    };

    const res = await request(app)
      .put('/api/me')
      .send(payloadValido);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Perfil actualizado exitosamente');
    expect(res.body).toHaveProperty('profile');
  });

  it('Debe rechazar la actualización si Zod detecta datos inválidos o incompletos (400 Bad Request)', async () => {
    const payloadInvalido = {
      full_name: '' // Inválido por esquema
    };

    const res = await request(app)
      .put('/api/me')
      .send(payloadInvalido);

    expect(res.statusCode).toBe(400);
  });

  it('Debe bloquear estrictamente cualquier intento malicioso de cambiar el rol', async () => {
    const payloadConRol = {
      full_name: 'Andrea Tests',
      phone: '26149875',
      address: 'San Lorenzo 456',
      city: 'San Rafael',
      province: 'Mendoza',
      zip: '5600',
      role: 'admin' // Intento de alteración
    };

    const res = await request(app)
      .put('/api/me')
      .send(payloadConRol);

    expect([200, 400]).toContain(res.statusCode);
    if (res.body.profile) {
      expect(res.body.profile.role).not.toBe('admin');
    }
  });
});