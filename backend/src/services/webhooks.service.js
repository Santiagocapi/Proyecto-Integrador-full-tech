// Notificaciones (webhooks) de Mercado Pago. El aviso solo indica que un pago cambió:
// siempre se vuelve a consultar el pago en Mercado Pago antes de tocar el pedido.
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from 'mercadopago'
import { env } from '../config/env.js'
import { supabase } from '../config/supabase.js'
import { getPayment } from './mercadopago.service.js'

// Mercado Pago reintenta ante cualquier respuesta que no sea 2xx
const RECEIVED = { status: 200, body: { received: true } }
const AMOUNT_TOLERANCE = 0.01

// Tipo e id del aviso: el formato nuevo usa `type` y `data.id`; el viejo, `topic`
function parseNotification(query, body) {
  const type = query.type ?? body?.type ?? query.topic ?? body?.topic
  const paymentId = query['data.id'] ?? body?.data?.id
  return { type, paymentId: paymentId ? String(paymentId) : undefined }
}

// Devuelve false si la firma no es válida. Sin secreto (desarrollo local) no se valida.
function hasValidSignature(query, headers) {
  if (!env.MP_WEBHOOK_SECRET) {
    console.warn('MP_WEBHOOK_SECRET no configurado: se omite la validación de la firma del webhook')
    return true
  }
  try {
    WebhookSignatureValidator.validate({
      xSignature: headers['x-signature'],
      xRequestId: headers['x-request-id'],
      dataId: query['data.id'],
      secret: env.MP_WEBHOOK_SECRET,
      toleranceSeconds: 300,
    })
    return true
  } catch (error) {
    if (!(error instanceof InvalidWebhookSignatureError)) throw error
    // Se registra el motivo y el request id, nunca el secreto ni la firma
    console.warn('Firma de webhook inválida:', error.reason, error.requestId)
    return false
  }
}

function matchesOrder(payment, order) {
  const amountOk =
    Math.abs(Number(payment.transaction_amount) - Number(order.total)) <= AMOUNT_TOLERANCE
  return amountOk && payment.currency_id === 'ARS'
}

// Pasa el pedido de pendiente a pagado. El filtro por estado lo hace idempotente:
// si ya estaba pagado no se actualiza ninguna fila.
async function markAsPaid(order, payment) {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'pagado',
      paid_at: payment.date_approved ?? new Date().toISOString(),
      mp_payment_id: String(payment.id),
    })
    .eq('id', order.id)
    .eq('status', 'pendiente')
    .select('id')
  // 23505: ese mp_payment_id ya está registrado, la notificación ya se procesó
  if (error && error.code !== '23505') throw error
}

export async function handleMercadoPagoNotification({ query = {}, headers = {}, body = {} }) {
  const { type, paymentId } = parseNotification(query, body)
  if (type !== 'payment' || !paymentId) return RECEIVED

  if (!hasValidSignature(query, headers)) {
    return { status: 401, body: { error: 'Firma inválida' } }
  }

  const payment = await getPayment(paymentId)

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, tracking_code, status, total')
    .eq('tracking_code', payment.external_reference)
    .maybeSingle()
  if (error) throw error
  if (!order) {
    console.info('Webhook de Mercado Pago sin pedido asociado:', payment.external_reference)
    return RECEIVED
  }

  // Rechazado, pendiente, etc.: el pedido sigue pendiente para que el comprador reintente
  if (payment.status !== 'approved') return RECEIVED

  // El pedido venció y ya devolvió su stock: no se revive. Queda registrado para reembolsar a mano.
  if (order.status === 'cancelado') {
    console.error('Pago aprobado de un pedido cancelado, requiere reembolso', order.tracking_code, {
      paymentId: String(payment.id),
      amount: payment.transaction_amount,
    })
    return RECEIVED
  }

  if (!matchesOrder(payment, order)) {
    console.error('Pago aprobado que no coincide con el pedido', order.tracking_code, {
      paymentId: String(payment.id),
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      total: order.total,
    })
    return RECEIVED
  }

  await markAsPaid(order, payment)
  return RECEIVED
}
