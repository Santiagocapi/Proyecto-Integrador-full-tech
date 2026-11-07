import { supabase } from '../config/supabase.js'

export const cartService = {
  // Obtener el carrito del usuario desde la BD
  async getCart(userId) {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        variant_id,
        product_variants (
          id,
          name,
          stock,
          products (
            id,
            name,
            price,
            offer_price,
            images,
            slug
          )
        )
      `)
      .eq('user_id', userId)

    if (error) throw error

    // Mapeamos los datos para que tengan la estructura exacta que espera el store del frontend
    return (data || []).map(item => {
      const variant = item.product_variants || {}
      const product = variant.products || {}
      
      // Manejo seguro de imágenes (si es array o string)
      let imageUrl = ''
      if (Array.isArray(product.images) && product.images.length > 0) {
        imageUrl = product.images[0]
      } else if (typeof product.images === 'string') {
        imageUrl = product.images
      }

      return {
        variantId: item.variant_id,
        productId: product.id,
        name: product.name || 'Producto',
        variantName: variant.name || '',
        price: product.offer_price ?? product.price ?? 0, // Usa offer_price si existe, sino price
        image: imageUrl,
        quantity: item.quantity
      }
    })
  },

  // Reemplazar / Actualizar el carrito completo del usuario
  async saveCart(userId, items) {
    // Primero borramos los ítems actuales del usuario
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)

    if (deleteError) throw deleteError

    if (!items || items.length === 0) return []

    // Preparamos los nuevos ítems para insertar
    const formattedItems = items.map(item => ({
      user_id: userId,
      variant_id: item.variantId || item.variant_id,
      quantity: item.quantity
    }))

    const { error: insertError } = await supabase
      .from('cart_items')
      .insert(formattedItems)

    if (insertError) throw insertError

    // Como pidió tu compañero, devolvemos getCart() para que devuelva la estructura ya mapeada correctamente
    return await this.getCart(userId)
  },

  // Fusionar el carrito local de localStorage con el de la BD al iniciar sesión
  async mergeCart(userId, localItems) {
    const dbCart = await this.getCart(userId)

    // Lógica para combinar ambos carritos sumando cantidades si ya existe la variante
    const mergedMap = new Map()

    dbCart.forEach(item => {
      mergedMap.set(item.variantId, item.quantity)
    })

    localItems.forEach(localItem => {
      const vId = localItem.variantId || localItem.variant_id
      const qty = localItem.quantity
      if (mergedMap.has(vId)) {
        mergedMap.set(vId, mergedMap.get(vId) + qty)
      } else {
        mergedMap.set(vId, qty)
      }
    })

    const finalItems = Array.from(mergedMap.entries()).map(([variant_id, quantity]) => ({
      variant_id,
      quantity
    }))

    return await this.saveCart(userId, finalItems)
  }
}