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

  // Actualizar perfil del usuario autenticado (Protegiendo el rol)
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id; 
      
      // Extraemos solo los campos permitidos, ignorando cualquier intento de inyectar 'role'
      const { full_name, phone, address, city, province, zip } = req.body;

      // Intentamos actualizar directamente en la tabla profiles
      let { data, error } = await supabase
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
        .maybeSingle();

      // Si el perfil no existía previamente, lo insertamos
      if (!data && !error) {
        const insertRes = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name,
            phone,
            address,
            city,
            province,
            zip
          })
          .select()
          .single();
          
        data = insertRes.data;
        error = insertRes.error;
      }

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
      next(err);
    }
  }
};

export const updateProfile = meController.updateProfile;
export const getProfile = meController.getProfile;
export default meController;