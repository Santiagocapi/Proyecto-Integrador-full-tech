import express from 'express'
import request from 'supertest'
import { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { validate } from '../src/middlewares/validate.js'

describe('Validador de Rocío con getters de Express 5', () => {
  const app = express()
  app.get(
    '/query',
    validate(z.object({ page: z.coerce.number().int().positive() }), 'query'),
    (req, res) => res.json({ value: req.validatedQuery.page, raw: req.query.page }),
  )
  app.get(
    '/params/:id',
    validate(z.object({ id: z.coerce.number().int().positive() }), 'params'),
    (req, res) => res.json({ value: req.validatedParams.id }),
  )
  it('valida y transforma query sin reasignar el getter', async () => {
    const res = await request(app).get('/query?page=2')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ value: 2, raw: '2' })
  })
  it('rechaza query inválida con detalle', async () => {
    const res = await request(app).get('/query?page=abc')
    expect(res.status).toBe(400)
    expect(res.body.details[0].field).toBe('page')
  })
  it('valida y transforma params', async () => {
    const res = await request(app).get('/params/2')
    expect(res.status).toBe(200)
    expect(res.body.value).toBe(2)
  })
})
