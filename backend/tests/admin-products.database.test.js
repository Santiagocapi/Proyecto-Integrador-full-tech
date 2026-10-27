import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let db
const payload = (slug, sku) => ({
  category_id: '1',
  name: slug,
  slug,
  description: null,
  price: 10,
  offer_price: null,
  connection_type: null,
  compatibility: [],
  specs: {},
  images: [],
  is_bundle: false,
  active: true,
  variants: [{ name: 'Único', sku, stock: 2 }],
})
const save = async (id, body) =>
  (
    await db.query('SELECT public.admin_save_product($1, $2::jsonb) AS product', [
      id,
      JSON.stringify(body),
    ])
  ).rows[0].product
describe('Migración 008 en PostgreSQL local aislado', () => {
  beforeAll(async () => {
    db = new PGlite()
    await db.exec(
      'CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;',
    )
    for (const file of ['001_catalogo.sql', '007_permisos.sql', '008_admin_products.sql']) {
      await db.exec(
        await readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8'),
      )
    }
    await db.exec("INSERT INTO categories(name, slug) VALUES ('Audio', 'audio')")
  }, 30000)
  afterAll(async () => {
    await db?.close()
  })
  it('crea producto y variantes mediante service_role', async () => {
    await db.exec('SET ROLE service_role')
    try {
      const product = await save(null, payload('micro', 'MIC'))
      expect(product.id).toEqual(expect.any(String))
      expect(product.product_variants[0].stock).toBe(2)
    } finally {
      await db.exec('RESET ROLE')
    }
  })
  it('revierte toda el alta ante SKU duplicado', async () => {
    await expect(save(null, payload('duplicado', 'MIC'))).rejects.toMatchObject({ code: '23505' })
    expect((await db.query("SELECT * FROM products WHERE slug='duplicado'")).rows).toHaveLength(0)
  })
  it('revierte edición y stock si una segunda variante falla', async () => {
    const original = (await db.query("SELECT id FROM products WHERE slug='micro'")).rows[0]
    const variant = (
      await db.query('SELECT id FROM product_variants WHERE product_id=$1', [original.id])
    ).rows[0]
    const body = payload('editado', 'MIC')
    body.variants = [
      { id: String(variant.id), name: 'Cambio', sku: 'MIC', stock: 20 },
      { name: 'Duplicado', sku: 'MIC', stock: 3 },
    ]
    await expect(save(original.id, body)).rejects.toMatchObject({ code: '23505' })
    expect(
      (await db.query('SELECT slug FROM products WHERE id=$1', [original.id])).rows[0].slug,
    ).toBe('micro')
    expect(
      (await db.query('SELECT stock FROM product_variants WHERE id=$1', [variant.id])).rows[0]
        .stock,
    ).toBe(2)
  })
  it('conserva variantes omitidas y sus referencias', async () => {
    const product = await save(null, payload('conserva', 'CONSERVA-1'))
    await db.exec(
      'CREATE TABLE test_order_refs (variant_id BIGINT REFERENCES product_variants(id))',
    )
    await db.query('INSERT INTO test_order_refs VALUES ($1)', [product.product_variants[0].id])
    const updated = await save(product.id, payload('conserva', 'CONSERVA-2'))
    expect(updated.product_variants).toHaveLength(2)
    expect(updated.product_variants[0].id).toBe(product.product_variants[0].id)
    expect(
      (
        await db.query(
          'SELECT * FROM test_order_refs r JOIN product_variants v ON v.id=r.variant_id',
        )
      ).rows,
    ).toHaveLength(1)
  })
  it('conserva componentes de un pack y rechaza convertirlo a producto común', async () => {
    const component = await save(null, payload('componente', 'COMPONENTE'))
    const body = { ...payload('pack', 'PACK'), is_bundle: true }
    const pack = await save(null, body)
    await db.query('INSERT INTO bundle_items VALUES ($1,$2,1)', [pack.id, component.id])
    body.variants[0].id = pack.product_variants[0].id
    await save(pack.id, body)
    await expect(save(pack.id, { ...body, is_bundle: false })).rejects.toMatchObject({
      code: '22023',
    })
    expect(
      (await db.query('SELECT * FROM bundle_items WHERE bundle_id=$1', [pack.id])).rows,
    ).toHaveLength(1)
  })
  it('rechaza variantes ajenas y conserva el producto', async () => {
    const one = await save(null, payload('uno', 'UNO'))
    const two = await save(null, payload('dos', 'DOS'))
    const body = payload('invadido', 'DOS')
    body.variants[0].id = two.product_variants[0].id
    await expect(save(one.id, body)).rejects.toMatchObject({ code: '22023' })
    expect((await db.query('SELECT slug FROM products WHERE id=$1', [one.id])).rows[0].slug).toBe(
      'uno',
    )
  })
  it('responde recurso inexistente', async () => {
    await expect(save('99999', payload('ausente', 'AUSENTE'))).rejects.toMatchObject({
      code: 'P0002',
    })
  })
  it('rechaza categoría inexistente y no deja registros parciales', async () => {
    await expect(
      save(null, { ...payload('sin-categoria', 'SIN-CAT'), category_id: '9999' }),
    ).rejects.toMatchObject({ code: '23503' })
    expect((await db.query("SELECT * FROM products WHERE slug='sin-categoria'")).rows).toHaveLength(
      0,
    )
  })
  it.each(['anon', 'authenticated'])('impide ejecutar la función como %s', async (role) => {
    await db.exec(`SET ROLE ${role}`)
    try {
      await expect(save(null, payload('prohibido', 'NO'))).rejects.toMatchObject({ code: '42501' })
    } finally {
      await db.exec('RESET ROLE')
    }
  })
})
