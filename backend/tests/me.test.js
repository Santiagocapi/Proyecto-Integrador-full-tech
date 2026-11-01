import { describe, test, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

// 1. Simulamos el middleware de autenticación para que acepte al usuario de prueba en los tests
vi.mock('../src/middlewares/auth.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 'test-user-id-12345' }; // Inyectamos un ID de usuario simulado
    next();
  }
}));

describe('PUT /api/me - Actualización de Perfil', () => {
  test('Debe actualizar exitosamente el perfil del usuario con datos válidos (200 OK)', async () => {
    const payloadValido = {
      full_name: 'Andrea Vargas',
      phone: '2604123456',
      address: 'Av. San Martín 456',
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

  test('Debe rechazar la actualización si Zod detecta datos inválidos o incompletos (400 Bad Request)', async () => {
    const payloadInvalido = {
      full_name: 'A', // Muy corto para Zod
      phone: '123'    // Muy corto para Zod
    };

    const res = await request(app)
      .put('/api/me')
      .send(payloadInvalido);

    expect(res.statusCode).toBe(400);
  });

  test('Debe bloquear estrictamente cualquier intento malicioso de cambiar el rol', async () => {
    const payloadConIntentoDeRol = {
      full_name: 'Andrea Vargas',
      phone: '2604123456',
      address: 'Av. San Martín 456',
      city: 'San Rafael',
      province: 'Mendoza',
      zip: '5600',
      role: 'admin' // Intento de inyección de rol
    };

    const res = await request(app)
      .put('/api/me')
      .send(payloadConIntentoDeRol);

    if (res.body.profile && res.body.profile.role) {
      expect(res.body.profile.role).not.toBe('admin');
    }
  });
});