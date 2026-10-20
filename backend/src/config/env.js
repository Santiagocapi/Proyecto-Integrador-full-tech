// Este archivo se encarga de cargar y validar las variables de entorno necesarias para la aplicación. 
// Utiliza la librería zod para definir un esquema de validación y asegurar que todas las variables requeridas estén presentes y sean válidas. Si alguna variable falta o es inválida, el proceso se detiene y se muestra un mensaje de error.
import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Faltan variables de entorno o son inválidas:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data