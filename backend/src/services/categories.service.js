import { supabase } from '../config/supabase.js'

export const categoriesService = {
  async list() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    return data
  },
}