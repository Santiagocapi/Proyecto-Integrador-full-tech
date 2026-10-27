import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../src/config/supabase.js'
import { adminProductsService as service } from '../src/services/admin-products.service.js'

vi.mock('../src/config/supabase.js', () => ({
  supabase: { rpc: vi.fn(), from: vi.fn(), storage: { from: vi.fn() } },
}))
describe('Servicios de administración', () => {
  beforeEach(() => vi.resetAllMocks())
  it('usa una sola operación atómica', async () => {
    supabase.rpc.mockResolvedValue({ data: { id: '1' }, error: null })
    const body = { variants: [{ sku: 'NEW' }] }
    expect(await service.save(null, body)).toEqual({ id: '1' })
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('admin_save_product', {
      p_id: null,
      p_payload: body,
    })
    expect(supabase.from).not.toHaveBeenCalled()
  })
  it('no admite ids de variantes al crear', async () => {
    await expect(service.save(null, { variants: [{ id: '1' }] })).rejects.toMatchObject({
      status: 400,
    })
    expect(supabase.rpc).not.toHaveBeenCalled()
  })
  it.each([
    ['23505', 409],
    ['23503', 400],
    ['22023', 400],
    ['P0002', 404],
    ['PGRST202', 503],
  ])('traduce %s a %s', async (code, status) => {
    supabase.rpc.mockResolvedValue({ error: { code } })
    await expect(service.save('1', {})).rejects.toMatchObject({ status })
  })
  it('baja con UPDATE sin borrar variantes', async () => {
    const update = vi
      .fn()
      .mockReturnValue({
        eq: vi
          .fn()
          .mockReturnValue({
            select: () => ({ maybeSingle: async () => ({ data: { id: '1', active: false } }) }),
          }),
      })
    supabase.from.mockReturnValue({ update })
    await service.deactivate('1')
    expect(supabase.from).toHaveBeenCalledExactlyOnceWith('products')
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ active: false }))
  })
  it.each([
    ['image/png', Buffer.from('<script>bad</script>')],
    ['image/jpeg', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])],
  ])('rechaza archivo disfrazado de %s', async (mimetype, buffer) => {
    await expect(service.upload({ mimetype, buffer })).rejects.toMatchObject({ status: 400 })
    expect(supabase.storage.from).not.toHaveBeenCalled()
  })
  it('genera rutas únicas y nunca sobrescribe imágenes', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null })
    const getPublicUrl = vi.fn((path) => ({ data: { publicUrl: `https://example.com/${path}` } }))
    supabase.storage.from.mockReturnValue({ upload, getPublicUrl })
    const file = { mimetype: 'image/png', buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) }
    const first = await service.upload(file)
    const second = await service.upload(file)
    expect(first.url).not.toBe(second.url)
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^admin\/.*\.png$/), file.buffer, {
      contentType: 'image/png',
      upsert: false,
    })
  })
})
