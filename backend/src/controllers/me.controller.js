import { supabase } from '../config/supabase.js';

export const meController = {
  // Obtener perfil del usuario autenticado
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return res.json(data);
    } catch (err) {
      next(err);
    }
  },

  // Actualizar perfil del usuario autenticado
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id; // Inyectado por middleware requireAuth

      // Extraemos solo las variables permitidas (evita asignación masiva insegura)
      const { full_name, phone, address, city, province, zip } = req.body;

      // Actualización directa y segura en la tabla 'profiles'
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name,
          phone,
          address,
          city,
          province,
          zip
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ 
          error: 'Error al actualizar el perfil', 
          details: error.message 
        });
      }

      return res.status(200).json({
        message: 'Perfil actualizado exitosamente',
        profile: data
      });
    } catch (err) {
      next(err); // Capturado por el handler global de errores
    }
  }
};