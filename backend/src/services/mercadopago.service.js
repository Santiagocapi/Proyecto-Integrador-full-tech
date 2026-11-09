// Integración con Mercado Pago Checkout Pro. El SDK queda aislado en este módulo
// para que el resto de la API (y los tests) no dependan de él.
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'
import { env } from '../config/env.js'

// La preferencia vence a los 30 minutos: después el pedido pendiente se puede cancelar.
const EXPIRATION_MS = 30 * 60 * 1000

const isHttps = (url) => typeof url === 'string' && url.startsWith('https://')
const trimSlash = (url) => url.replace(/\/+$/, '')

// Arma el cuerpo de la preferencia. Es puro para poder probarlo sin llamar a Mercado Pago.
export function buildPreferenceBody(
  { order, items, payerEmail },
  { frontendUrl = env.FRONTEND_URL, apiPublicUrl = env.API_PUBLIC_URL, now = new Date() } = {},
) {
  const returnUrl = `${trimSlash(frontendUrl)}/confirmacion/${order.tracking_code}`

  const body = {
    items: items.map((item) => ({
      id: String(item.variant_id),
      title:
        item.variant_name && item.variant_name !== 'Único'
          ? `${item.product_name} - ${item.variant_name}`
          : item.product_name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      currency_id: 'ARS',
    })),
    external_reference: order.tracking_code,
    payer: { email: payerEmail },
    back_urls: { success: returnUrl, pending: returnUrl, failure: returnUrl },
    expires: true,
    expiration_date_to: new Date(now.getTime() + EXPIRATION_MS).toISOString(),
  }

  // Mercado Pago rechaza auto_return si las URLs de retorno no son https (ej. localhost)
  if (isHttps(frontendUrl)) body.auto_return = 'approved'
  // Las notificaciones solo llegan a una URL pública con https
  if (isHttps(apiPublicUrl)) {
    body.notification_url = `${trimSlash(apiPublicUrl)}/api/webhooks/mercadopago`
  }

  return body
}

// Cliente del SDK; falla con un error claro si no hay token configurado
function createClient() {
  if (!env.MP_ACCESS_TOKEN) {
    throw new Error('Falta configurar MP_ACCESS_TOKEN para cobrar con Mercado Pago')
  }
  return new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN })
}

// Crea la preferencia en Mercado Pago y devuelve { id, init_point }.
export async function createPreference({ order, items, payerEmail }) {
  const client = createClient()
  const preference = await new Preference(client).create({
    body: buildPreferenceBody({ order, items, payerEmail }),
    // Evita crear dos preferencias para el mismo pedido si el SDK reintenta
    requestOptions: { idempotencyKey: `order-${order.id}` },
  })

  return { id: preference.id, init_point: preference.init_point }
}

// Consulta un pago en Mercado Pago. Es la fuente de verdad: el webhook solo avisa que algo cambió.
export async function getPayment(id) {
  return new Payment(createClient()).get({ id })
}
