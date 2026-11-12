import { supabase } from '../config/supabase.js'

function fail(error) {
  if (!error) return
  const status = { FT003: 409, FT004: 400, 23503: 400, PGRST202: 503 }[error.code]
  if (!status) throw error
  throw Object.assign(
    new Error(status === 503 ? 'Falta instalar la migración 012 del carrito' : error.message),
    { status },
  )
}
async function write(userId, items, mergeId = null) {
  const { error } = await supabase.rpc('save_cart', {
    p_user_id: userId,
    p_items: items.map((item) => ({
      variant_id: String(item.variant_id ?? item.variantId),
      quantity: item.quantity,
    })),
    p_merge_id: mergeId,
  })
  fail(error)
  return cartService.getCart(userId)
}
export const cartService = {
  async getCart(userId) {
    const { data, error } = await supabase
      .from('cart_items')
      .select(
        `
      quantity, variant_id,
      product_variants (id, name, stock, products (id, name, price, offer_price, images, slug, active))
    `,
      )
      .eq('user_id', userId)
      .order('variant_id')
    fail(error)
    return (data ?? []).map((item) => {
      const variant = item.product_variants
      const product = variant.products
      return {
        variantId: String(item.variant_id),
        productId: String(product.id),
        name: product.name,
        variantName: variant.name,
        price: Number(product.offer_price ?? product.price),
        image: Array.isArray(product.images) ? (product.images[0] ?? '') : (product.images ?? ''),
        quantity: item.quantity,
        stock: product.active ? variant.stock : 0,
      }
    })
  },
  saveCart: (userId, items) => write(userId, items),
  mergeCart: (userId, items, mergeId) => write(userId, items, mergeId),
}
