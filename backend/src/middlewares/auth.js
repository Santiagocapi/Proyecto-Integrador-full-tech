import { supabase } from '../config/supabase.js'

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticación no proporcionado' })
    }

    const token = authHeader.split(' ')[1]

    // 1. Verificar token con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser(token)

    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Token inválido o expirado' })
    }

    // 2. Cargar el perfil con el rol desde la tabla profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return res.status(401).json({ error: 'Perfil de usuario no encontrado' })
    }

    // 3. Dejar usuario y perfil en req.user
    req.user = {
      ...profile,
      id: authData.user.id,
      email: authData.user.email
    }

    next()
  } catch (error) {
    next(error)
  }
}