import { supabase } from '../config/supabase.js'

export const registerUser = async ({ email, password, full_name, phone }) => {
  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError) {
    // Si el email ya está registrado, devolvemos 409 Conflict
    if (
      authError.message.toLowerCase().includes('already') ||
      authError.status === 422
    ) {
      const error = new Error('El email ya está registrado')
      error.status = 409
      throw error
    }
    throw authError
  }

  const userId = authData.user.id

  // 2. Crear o actualizar su fila en la tabla profiles con rol comprador
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name,
      phone: phone || null,
      role: 'comprador'
    })
    .select()
    .single()

  if (profileError) {
    // Rollback por seguridad: si falla la creación del perfil, borramos el usuario de Auth
    await supabase.auth.admin.deleteUser(userId)
    throw profileError
  }

  return {
    user: {
      id: userId,
      email: authData.user.email
    },
    profile
  }
}