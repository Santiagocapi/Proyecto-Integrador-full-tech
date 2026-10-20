import { createClient } from '@supabase/supabase-js'

// Cliente con la clave pública: solo se usa para iniciar y cerrar sesión.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)