import { describe, it, expect, vi, beforeEach } from 'vitest'

// Base en memoria que imita solo las consultas que usa admin-orders.service.js
const { db } = vi.hoisted(() => {
  const db = { orders: [], product_variants: [] }

  function from(table) {
    const q = { op: 'select', filters: [], patch: null }
    const run = () => {
      const rows = db[table].filter((row) => q.filters.every(([col, val]) => row[col] === val))
      if (q.op === 'update') rows.forEach((row) => Object.assign(row, q.patch))
      return rows
    }
    const builder = {
      select: () => builder,
      update: (patch) => {
        q.op = 'update'
        q.patch = patch
        return builder
      },
      eq: (col, val) => {
        q.filters.push([col, val])
        return builder
      },
      maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
      single: async () => ({ data: run()[0] ?? null, error: null }),
      then: (resolve, reject) =>
        Promise.resolve({ data: run(), error: null }).then(resolve, reject),
    }
    return builder
  }

  return { db: Object.assign(db, { from }) }
})

vi.mock('../src/config/supabase.js', () => ({ supabase: { from: db.from } }))

import { updateStatus } from '../src/services/admin-orders.service.js'

const stockOf = (id) => db.product_variants.find((v) => v.id === id).stock

beforeEach(() => {
  db.orders.length = 0
  db.product_variants.length = 0
  db.product_variants.push({ id: 10, stock: 3 }, { id: 11, stock: 0 })
  db.orders.push({
    id: 1,
    status: 'pagado',
    order_items: [
      { variant_id: 10, quantity: 2 },
      { variant_id: 10, quantity: 1 },
      { variant_id: 11, quantity: 1 },
    ],
  })
})

describe('updateStatus', () => {
  it('cambia el estado sin tocar el stock si no se cancela', async () => {
    const result = await updateStatus(1, 'enviado')
    expect(result.order.status).toBe('enviado')
    expect(stockOf(10)).toBe(3)
    expect(stockOf(11)).toBe(0)
  })

  it('al cancelar devuelve el stock de cada variante (sumando repetidas)', async () => {
    const result = await updateStatus(1, 'cancelado')
    expect(result.order.status).toBe('cancelado')
    expect(stockOf(10)).toBe(6)
    expect(stockOf(11)).toBe(1)
  })

  it('no devuelve el stock dos veces si se vuelve a cancelar', async () => {
    await updateStatus(1, 'cancelado')
    const result = await updateStatus(1, 'cancelado')
    expect(result.order.status).toBe('cancelado')
    expect(stockOf(10)).toBe(6)
  })

  it('no permite sacar un pedido del estado cancelado', async () => {
    await updateStatus(1, 'cancelado')
    const result = await updateStatus(1, 'pagado')
    expect(result).toEqual({ error: 'cancelled' })
    expect(db.orders[0].status).toBe('cancelado')
    expect(stockOf(10)).toBe(6)
  })

  it('devuelve not_found si el pedido no existe', async () => {
    const result = await updateStatus(999, 'enviado')
    expect(result).toEqual({ error: 'not_found' })
  })
})
