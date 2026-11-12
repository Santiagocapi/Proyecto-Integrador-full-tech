// Este archivo se encarga de cargar y validar las variables de entorno necesarias para la aplicación. 
// Utiliza la librería zod para definir un esquema de validación y asegurar que todas las variables requeridas estén presentes y sean válidas. Si alguna variable falta o es inválida, el proceso se detiene y se muestra un mensaje de error.
import 'dotenv/config'
import { z } from 'zod'

// Variable opcional: una línea vacía en el .env (ej. `API_PUBLIC_URL=`) cuenta como no definida
const optional = (type) => z.preprocess((value) => (value === '' ? undefined : value), type.optional())

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Mercado Pago: opcionales para que los tests y CI no fallen; el servicio de pagos
  // avisa con un error claro si se usa sin token.
  MP_ACCESS_TOKEN: optional(z.string()),
  MP_WEBHOOK_SECRET: optional(z.string()),
  // URL del frontend, a donde vuelve el comprador después de pagar
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  // URL pública de esta API (https) para recibir las notificaciones de Mercado Pago
  API_PUBLIC_URL: optional(z.string().url()),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Faltan variables de entorno o son inválidas:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data