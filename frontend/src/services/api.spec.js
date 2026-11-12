// @vitest-environment node
import { createServer } from 'node:http'
import { Buffer } from 'node:buffer'
import { once } from 'node:events'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: 'test-admin' } } })),
    },
  },
}))

let server
let api

beforeAll(async () => {
  server = createServer(async (req, res) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks)
    res.setHeader('Content-Type', 'application/json')
    if (req.url === '/api/admin/uploads') {
      try {
        const form = await new Response(body, {
          headers: { 'Content-Type': req.headers['content-type'] },
        }).formData()
        const file = form.get('file')
        res.end(
          JSON.stringify({
            name: file.name,
            bytes: [...new Uint8Array(await file.arrayBuffer())],
            auth: req.headers.authorization,
          }),
        )
      } catch {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'Falta el archivo file' }))
      }
    } else {
      res.end(body)
    }
  }).listen(0, '127.0.0.1')
  await once(server, 'listening')
  vi.stubEnv('VITE_API_URL', `http://127.0.0.1:${server.address().port}/api`)
  ;({ api } = await import('./api'))
})

afterAll(async () => {
  vi.unstubAllEnvs()
  if (server) await new Promise((resolve) => server.close(resolve))
})

describe('Transporte de la API', () => {
  it('envía un archivo multipart con contenido y autenticación a un servidor HTTP real', async () => {
    const body = new FormData()
    const bytes = [137, 80, 78, 71, 13, 10, 26, 10]
    body.append('file', new Blob([new Uint8Array(bytes)], { type: 'image/png' }), 'producto.png')
    expect(await api.post('/admin/uploads', body, { auth: true })).toEqual({
      name: 'producto.png',
      bytes,
      auth: 'Bearer test-admin',
    })
  })

  it('sigue enviando JSON para guardar los productos', async () => {
    const product = {
      category_id: '1',
      name: 'Micrófono',
      images: ['https://example.com/photo.png'],
    }
    expect(await api.put('/admin/products/3', product)).toEqual(product)
  })
  it('no manda guardados de un carrito con la sesión de otra cuenta', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    try {
      await expect(api.put('/cart', { items: [] }, { auth: true, userId: 'otra-cuenta' }))
        .rejects.toMatchObject({ status: 401 })
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally { fetchSpy.mockRestore() }
  })
})
