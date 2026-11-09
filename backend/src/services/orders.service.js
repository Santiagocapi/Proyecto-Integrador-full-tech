import { supabase } from '../config/supabase.js'
import { createPreference } from './mercadopago.service.js'

function httpError(status, message, details) {
  const error = new Error(message)
  error.status = status
  if (details !== undefined) error.details = details
  return error
}

// El DETAIL de FT002 viene como texto JSON desde la función SQL
function parseDetails(details) {
  try {
    return JSON.parse(details)
  } catch {
    return undefined
  }
}

// Traduce los errores propios de create_order (ver migración 009) a errores HTTP
function translateCreateError(error) {
  if (error.code === 'FT001') return httpError(400, 'El carrito está vacío')
  if (error.code === 'FT002') return httpError(409, error.message, parseDetails(error.details))
  return error
}

// Crea la preferencia de pago y la asocia al pedido. Devuelve la URL de pago.
async function startMercadoPagoPayment(order, payerEmail) {
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('variant_id, product_name, variant_name, unit_price, quantity')
    .eq('order_id', order.id)
  if (itemsError) throw itemsError

  const preference = await createPreference({ order, items, payerEmail })

  const { error: updateError } = await supabase
    .from('orders')
    .update({ mp_preference_id: preference.id })
    .eq('id', order.id)
  if (updateError) throw updateError

  return preference.init_point
}

// Columnas de lectura de un pedido con su detalle embebido (FK order_items.order_id → orders.id).
// user_id se lee solo para chequear el dueño; nunca se expone.
const ORDER_SELECT = `
  id, user_id, tracking_code, status, total, payment_method, created_at, paid_at,
  shipping_name, shipping_address, shipping_city, shipping_zip, shipping_phone,
  order_items ( id, variant_id, product_name, variant_name, unit_price, quantity )
`

// Forma pública de un pedido: convierte bigint/numeric y oculta user_id y datos de Mercado Pago
function toOrderResponse(row) {
  return {
    id: String(row.id),
    tracking_code: row.tracking_code,
    status: row.status,
    total: Number(row.total),
    payment_method: row.payment_method,
    created_at: row.created_at,
    paid_at: row.paid_at,
    shipping: {
      name: row.shipping_name,
      address: row.shipping_address,
      city: row.shipping_city,
      zip: row.shipping_zip,
      phone: row.shipping_phone,
    },
    items: (row.order_items ?? []).map((item) => ({
      variant_id: String(item.variant_id),
      product_name: item.product_name,
      variant_name: item.variant_name,
      unit_price: Number(item.unit_price),
      quantity: item.quantity,
    })),
  }
}

export const ordersService = {
  async listByUser(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { referencedTable: 'order_items', ascending: true })
    if (error) throw error
    return (data ?? []).map(toOrderResponse)
  },

  // Solo el dueño o un admin pueden verlo; para cualquier otro se responde igual que si no existiera
  async getByTracking(tracking, user) {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('tracking_code', tracking)
      .order('id', { referencedTable: 'order_items', ascending: true })
      .maybeSingle()
    if (error) throw error
    const canSee = data && (data.user_id === user.id || user.role === 'admin')
    if (!canSee) throw httpError(404, 'Pedido no encontrado')
    return toOrderResponse(data)
  },

  async create({ user, shipping, paymentMethod }) {
    // Toda la compra (stock, pedido, detalle y carrito) ocurre en una sola transacción SQL
    const { data: order, error } = await supabase.rpc('create_order', {
      p_user_id: user.id,
      p_shipping: shipping,
      p_payment_method: paymentMethod,
    })
    if (error) throw translateCreateError(error)

    let paymentUrl = null
    if (paymentMethod === 'mercadopago') {
      try {
        paymentUrl = await startMercadoPagoPayment(order, user.email)
      } catch (mpError) {
        console.error('Error al crear la preferencia de Mercado Pago:', mpError)
        // Si no se pudo iniciar el pago, se cancela el pedido para liberar el stock
        const { error: cancelError } = await supabase.rpc('cancel_order', { p_order_id: order.id })
        if (cancelError) console.error('No se pudo cancelar el pedido', order.id, cancelError)
        throw httpError(502, 'No se pudo iniciar el pago con Mercado Pago')
      }
    }

    return {
      tracking_code: order.tracking_code,
      status: order.status,
      total: order.total,
      payment_url: paymentUrl,
    }
  },
}
