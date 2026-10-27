import { supabase } from '../config/supabase.js'

export const productsService = {
  async list({ page = 1, limit = 10, category, minPrice, maxPrice, connection, compat, q, sort }) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('products')
      .select(
        `
          id,
          name,
          slug,
          description,
          price,
          offer_price,
          connection_type,
          compatibility,
          images,
          is_bundle,
          created_at,
          categories!inner (
            id,
            name,
            slug
          )
        `,
        { count: 'exact' },
      )
      .eq('active', true)

    // Filtrar por categoría
    if (category) {
      query = query.eq('categories.slug', category)
    }

    // Filtrar por precio mínimo
    if (minPrice !== undefined) {
      query = query.gte('price', minPrice)
    }

    // Filtrar por precio máximo
    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice)
    }

    // Filtrar por tipo de conexión
    if (connection) {
      query = query.ilike('connection_type', connection)
    }

    // compatibility es un array TEXT[] en PostgreSQL
    if (compat) {
      query = query.contains('compatibility', [compat])
    }

    // Buscar por nombre o descripción
    if (q) {
      // Las comillas aíslan el valor de la sintaxis de filtros de PostgREST.
      const pattern = `"%${q.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}%"`
      query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`)
    }

    // Ordenamiento
    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true })
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false })
    } else if (sort === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('id', { ascending: true })
    }

    // Desempatar evita un orden ambiguo entre páginas con igual precio o fecha.
    if (sort) {
      query = query.order('id', { ascending: true })
    }

    // Paginación
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error?.code === 'PGRST103') {
      // PostgREST devuelve 416 si el offset supera los resultados disponibles.
      // Recuperar el total con los mismos filtros desde la primera posición.
      const { count: total, error: countError } = await query.range(0, 0)
      if (countError) throw countError
      return { items: [], total: total ?? 0, page, pages: Math.ceil((total ?? 0) / limit) }
    }

    if (error) {
      throw error
    }

    return {
      items: data,
      total: count ?? 0,
      page,
      pages: Math.ceil((count ?? 0) / limit),
    }
  },

  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
          id,
          name,
          slug,
          description,
          price,
          offer_price,
          connection_type,
          compatibility,
          specs,
          images,
          is_bundle,
          created_at,
          categories (
            id,
            name,
            slug
          ),
          product_variants (
            id,
            name,
            sku,
            stock
          )
        `,
      )
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      const notFoundError = new Error('Producto no encontrado')
      notFoundError.status = 404
      throw notFoundError
    }

    // Si es un Starter Pack, buscamos los productos que incluye.
    if (data.is_bundle) {
      const { data: bundleItems, error: bundleError } = await supabase
        .from('bundle_items')
        .select(
          `
            quantity,
            product:products!bundle_items_product_id_fkey (
              id,
              name,
              slug,
              price,
              offer_price,
              images
            )
          `,
        )
        .eq('bundle_id', data.id)

      if (bundleError) {
        throw bundleError
      }

      data.bundle_items = bundleItems
    } else {
      data.bundle_items = []
    }

    return data
  },
}
