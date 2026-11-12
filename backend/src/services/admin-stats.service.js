import { supabase } from '../config/supabase.js'

// Una variante con este stock o menos cuenta como "poco stock"
export const LOW_STOCK_THRESHOLD = 5

/**
 * Métricas para el dashboard del panel:
 *  - totalOrders: cantidad de pedidos (todos los estados)
 *  - totalSales: suma del total de los pedidos que no están cancelados
 *  - lowStock: variantes de productos activos con stock <= LOW_STOCK_THRESHOLD
 */
export async function getStats() {
  const [ordersResult, lowStockResult] = await Promise.all([
    supabase.from('orders').select('total, status'),
    supabase
      .from('product_variants')
      .select('id, name, sku, stock, products!inner(id, name, active)')
      .lte('stock', LOW_STOCK_THRESHOLD)
      .eq('products.active', true)
      .order('stock', { ascending: true }),
  ])

  if (ordersResult.error) throw ordersResult.error
  if (lowStockResult.error) throw lowStockResult.error

  const orders = ordersResult.data
  const totalSales = orders
    .filter((order) => order.status !== 'cancelado')
    .reduce((sum, order) => sum + Number(order.total), 0)

  return {
    totalOrders: orders.length,
    totalSales: Math.round(totalSales * 100) / 100,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    lowStock: lowStockResult.data.map((variant) => ({
      variantId: variant.id,
      productId: variant.products.id,
      productName: variant.products.name,
      variantName: variant.name,
      sku: variant.sku,
      stock: variant.stock,
    })),
  }
}
