import { supabase } from '../config/supabase.js'

/**
 * Lista todos los pedidos (más nuevos primero), con su detalle y el nombre del cliente.
 * Si se pasa `status`, filtra por ese estado.
 */
export async function list({ status } = {}) {
  let query = supabase
    .from('orders')
    .select('*, profiles(full_name), order_items(*)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Cambia el estado de un pedido.
 *
 * Devuelve uno de estos resultados (el controlador decide el código HTTP):
 *  - { order }                    → cambio aplicado
 *  - { error: 'not_found' }       → el pedido no existe
 *  - { error: 'cancelled' }       → un pedido cancelado ya no puede cambiar de estado
 *  - { error: 'conflict' }        → otro admin cambió el pedido al mismo tiempo
 *
 * Si el nuevo estado es "cancelado", devuelve al stock de cada variante
 * las unidades que create_order había descontado.
 */
export async function updateStatus(id, newStatus) {
  const { data: current, error: findError } = await supabase
    .from('orders')
    .select('id, status, order_items(variant_id, quantity)')
    .eq('id', id)
    .maybeSingle()

  if (findError) throw findError
  if (!current) return { error: 'not_found' }

  // Mismo estado: no hay nada que hacer (evita devolver el stock dos veces)
  if (current.status === newStatus) return { order: current }

  // Un pedido cancelado ya devolvió su stock; reactivarlo exigiría volver a descontarlo
  if (current.status === 'cancelado') return { error: 'cancelled' }

  // El .eq('status', ...) evita que dos cambios simultáneos se pisen
  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', id)
    .eq('status', current.status)
    .select('*')
    .maybeSingle()

  if (updateError) throw updateError
  if (!updated) return { error: 'conflict' }

  if (newStatus === 'cancelado') {
    try {
      await restoreStock(current.order_items ?? [])
    } catch (err) {
      // Si no se pudo devolver el stock, se deshace el cambio de estado
      await supabase.from('orders').update({ status: current.status }).eq('id', id)
      throw err
    }
  }

  return { order: updated }
}

async function restoreStock(items) {
  // Suma las cantidades por variante por si el pedido repite alguna
  const totals = new Map()
  for (const item of items) {
    totals.set(item.variant_id, (totals.get(item.variant_id) ?? 0) + item.quantity)
  }

  for (const [variantId, quantity] of totals) {
    const { data: variant, error: readError } = await supabase
      .from('product_variants')
      .select('stock')
      .eq('id', variantId)
      .single()
    if (readError) throw readError

    const { error: writeError } = await supabase
      .from('product_variants')
      .update({ stock: variant.stock + quantity })
      .eq('id', variantId)
    if (writeError) throw writeError
  }
}
