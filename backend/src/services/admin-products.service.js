import { randomUUID } from 'node:crypto'
import { supabase } from '../config/supabase.js'

function fail(error) {
  if (!error) return
  const status = { 23505: 409, 23503: 400, 23514: 400, 22023: 400, P0002: 404, PGRST202: 503 }[
    error.code
  ]
  const message = {
    409: 'Slug o SKU ya existente',
    400: 'Datos o referencias inválidos',
    404: 'Recurso no encontrado',
    503: 'Falta instalar la migración de administración',
  }[status]
  if (status) throw Object.assign(new Error(message), { status })
  throw error
}

export const adminProductsService = {
  async save(id, payload) {
    if (!id && payload.variants.some((variant) => variant.id)) {
      throw Object.assign(new Error('Las variantes nuevas no deben tener id'), { status: 400 })
    }
    const { data, error } = await supabase.rpc('admin_save_product', {
      p_id: id,
      p_payload: payload,
    })
    fail(error)
    return data
  },
  async deactivate(id) {
    const { data, error } = await supabase
      .from('products')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, active')
      .maybeSingle()
    fail(error)
    if (!data) throw Object.assign(new Error('Producto no encontrado'), { status: 404 })
    return data
  },
  async stock(id, payload) {
    const { data, error } = await supabase
      .from('product_variants')
      .update(payload)
      .eq('id', id)
      .select('id, product_id, name, sku, stock')
      .maybeSingle()
    fail(error)
    if (!data) throw Object.assign(new Error('Variante no encontrada'), { status: 404 })
    return data
  },
  async upload(file) {
    const bytes = file.buffer
    let type
    if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
      type = ['jpg', 'image/jpeg']
    if (
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      type = ['png', 'image/png']
    if (
      bytes.length >= 12 &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP'
    )
      type = ['webp', 'image/webp']
    if (!type || type[1] !== file.mimetype)
      throw Object.assign(
        new Error('La imagen debe ser JPG, PNG o WEBP y coincidir con su contenido'),
        { status: 400 },
      )
    const path = `admin/${randomUUID()}.${type[0]}`
    const bucket = supabase.storage.from('products')
    const { error } = await bucket.upload(path, bytes, { contentType: type[1], upsert: false })
    fail(error)
    return { url: bucket.getPublicUrl(path).data.publicUrl }
  },
}
