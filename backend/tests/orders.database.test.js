import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Pedidos contra un PostgreSQL real en memoria: se ejecutan las migraciones tal cual.
const USER = '11111111-1111-1111-1111-111111111111'
const SHIPPING = {
  name: 'Ana',
  address: 'Calle 123',
  city: 'Rosario',
  zip: '2000',
  phone: '3411234567',
}

let db

const migration = (file) =>
  readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8')

const createOrder = async (paymentMethod = 'mercadopago') =>
  (
    await db.query('SELECT public.create_order($1, $2::jsonb, $3) AS result', [
      USER,
      JSON.stringify(SHIPPING),
      paymentMethod,
    ])
  ).rows[0].result

const stockOf = async (variantId) =>
  (await db.query('SELECT stock FROM product_variants WHERE id = $1', [variantId])).rows[0].stock

const statusOf = async (orderId) =>
  (await db.query('SELECT status FROM orders WHERE id = $1', [orderId])).rows[0].status

const addToCart = (variantId, quantity) =>
  db.query('INSERT INTO cart_items (user_id, variant_id, quantity) VALUES ($1, $2, $3)', [
    USER,
    variantId,
    quantity,
  ])

describe('Pedidos en PostgreSQL local aislado (migraciones 009, 010 y 011)', () => {
  let micVariant
  let lampVariant

  beforeAll(async () => {
    db = new PGlite()
    // Lo que Supabase ya trae y PGlite no: roles, auth.users y pg_cron.
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id UUID PRIMARY KEY, email TEXT, raw_user_meta_data JSONB);
      CREATE SCHEMA cron;
      CREATE TABLE cron.jobs (name TEXT PRIMARY KEY, schedule TEXT, command TEXT);
      CREATE FUNCTION cron.schedule(p_name TEXT, p_schedule TEXT, p_command TEXT)
      RETURNS BIGINT LANGUAGE sql AS $$
        INSERT INTO cron.jobs VALUES (p_name, p_schedule, p_command)
        ON CONFLICT (name) DO UPDATE SET schedule = EXCLUDED.schedule, command = EXCLUDED.command;
        SELECT 1::BIGINT;
      $$;
    `)
    for (const file of [
      '001_catalogo.sql',
      '002_profiles.sql',
      '003_carrito_pedidos.sql',
      '009_create_order.sql',
      '010_mercadopago.sql',
      '011_expire_orders.sql',
    ]) {
      await db.exec(await migration(file))
    }

    await db.exec(`
      INSERT INTO auth.users (id, email) VALUES ('${USER}', 'ana@test.com');
      INSERT INTO public.profiles (id) VALUES ('${USER}') ON CONFLICT DO NOTHING;
      INSERT INTO categories (name, slug) VALUES ('Audio', 'audio');
    `)
    const category = (await db.query('SELECT id FROM categories')).rows[0].id
    const insertProduct = async (name, price, offerPrice, stock) => {
      const product = (
        await db.query(
          `INSERT INTO products (category_id, name, slug, price, offer_price)
           VALUES ($1, $2, $2, $3, $4) RETURNING id`,
          [category, name, price, offerPrice],
        )
      ).rows[0].id
      return (
        await db.query(
          `INSERT INTO product_variants (product_id, name, sku, stock)
           VALUES ($1, 'Único', $2, $3) RETURNING id`,
          [product, `${name}-sku`, stock],
        )
      ).rows[0].id
    }
    micVariant = await insertProduct('micro', 1000, 800, 5)
    lampVariant = await insertProduct('lampara', 500, null, 3)
  }, 30000)

  afterAll(async () => {
    await db?.close()
  })

  beforeEach(async () => {
    await db.exec('DELETE FROM cart_items; DELETE FROM orders;')
    await db.query('UPDATE product_variants SET stock = 5 WHERE id = $1', [micVariant])
    await db.query('UPDATE product_variants SET stock = 3 WHERE id = $1', [lampVariant])
  })

  describe('create_order', () => {
    it('crea el pedido, copia los ítems, descuenta stock y vacía el carrito', async () => {
      await addToCart(micVariant, 2)
      await addToCart(lampVariant, 1)

      const result = await createOrder()

      // Total con precio de oferta cuando existe: 2 × 800 + 1 × 500
      expect(result).toMatchObject({ status: 'pendiente', total: 2100 })
      expect(result.tracking_code).toMatch(/^FT-[A-HJ-NP-Z2-9]{6}$/)

      const items = (
        await db.query(
          'SELECT variant_id, unit_price, quantity FROM order_items WHERE order_id = $1 ORDER BY variant_id',
          [result.id],
        )
      ).rows
      expect(items).toHaveLength(2)
      expect(Number(items[0].unit_price)).toBe(800)

      expect(await stockOf(micVariant)).toBe(3)
      expect(await stockOf(lampVariant)).toBe(2)
      expect((await db.query('SELECT * FROM cart_items')).rows).toHaveLength(0)
    })

    it('rechaza un carrito vacío con FT001', async () => {
      await expect(createOrder()).rejects.toMatchObject({ code: 'FT001' })
      expect((await db.query('SELECT * FROM orders')).rows).toHaveLength(0)
    })

    it('con stock insuficiente falla con FT002 y no deja nada a medias', async () => {
      await addToCart(micVariant, 1)
      await addToCart(lampVariant, 4)

      const error = await createOrder().catch((e) => e)
      expect(error).toMatchObject({ code: 'FT002' })
      expect(JSON.parse(error.detail)).toMatchObject({ available: 3, requested: 4 })

      expect((await db.query('SELECT * FROM orders')).rows).toHaveLength(0)
      expect(await stockOf(micVariant)).toBe(5)
      expect(await stockOf(lampVariant)).toBe(3)
      expect((await db.query('SELECT * FROM cart_items')).rows).toHaveLength(2)
    })
  })

  describe('cancel_order', () => {
    it('devuelve el stock una sola vez aunque se llame dos veces', async () => {
      await addToCart(micVariant, 2)
      const { id } = await createOrder()

      const cancel = async () =>
        (await db.query('SELECT public.cancel_order($1) AS ok', [id])).rows[0].ok
      expect(await cancel()).toBe(true)
      expect(await cancel()).toBe(false)

      expect(await statusOf(id)).toBe('cancelado')
      expect(await stockOf(micVariant)).toBe(5)
    })
  })

  describe('expire_pending_orders', () => {
    const backdate = (orderId, minutes) =>
      db.query(`UPDATE orders SET created_at = now() - make_interval(mins => $2) WHERE id = $1`, [
        orderId,
        minutes,
      ])
    const newOrder = async (paymentMethod, minutesAgo) => {
      await addToCart(micVariant, 1)
      const { id } = await createOrder(paymentMethod)
      await backdate(id, minutesAgo)
      return id
    }

    it('cancela solo los pedidos de Mercado Pago pendientes de más de 60 minutos', async () => {
      const expired = await newOrder('mercadopago', 61)
      const recent = await newOrder('mercadopago', 30)
      const transfer = await newOrder('transferencia', 120)
      const paid = await newOrder('mercadopago', 120)
      await db.query("UPDATE orders SET status = 'pagado' WHERE id = $1", [paid])
      expect(await stockOf(micVariant)).toBe(1)

      const count = (await db.query('SELECT public.expire_pending_orders() AS n')).rows[0].n

      expect(count).toBe(1)
      expect(await statusOf(expired)).toBe('cancelado')
      expect(await statusOf(recent)).toBe('pendiente')
      expect(await statusOf(transfer)).toBe('pendiente')
      expect(await statusOf(paid)).toBe('pagado')
      // Solo vuelve la unidad del pedido vencido
      expect(await stockOf(micVariant)).toBe(2)
    })

    it('agenda el job de pg_cron cada 10 minutos', async () => {
      const job = (await db.query("SELECT * FROM cron.jobs WHERE name = 'expire-pending-orders'"))
        .rows[0]
      expect(job).toMatchObject({
        schedule: '*/10 * * * *',
        command: 'SELECT public.expire_pending_orders()',
      })
    })
  })
})
