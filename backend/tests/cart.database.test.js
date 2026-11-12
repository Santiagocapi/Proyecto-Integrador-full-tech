import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { beforeAll, beforeEach, afterAll, describe, it, expect } from 'vitest'

const USER = '11111111-1111-1111-1111-111111111111'
const OTHER = '22222222-2222-2222-2222-222222222222'
const MERGE = '33333333-3333-4333-8333-333333333333'
let db
const save = (items, merge = null, user = USER) =>
  db.query('SELECT public.save_cart($1,$2::jsonb,$3)', [user, JSON.stringify(items), merge])
const cart = async (user = USER) =>
  (
    await db.query(
      'SELECT variant_id::text, quantity FROM cart_items WHERE user_id=$1 ORDER BY variant_id',
      [user],
    )
  ).rows
describe('Carrito transaccional en PostgreSQL local aislado', () => {
  beforeAll(async () => {
    db = new PGlite()
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE TABLE public.profiles(id UUID PRIMARY KEY);`)
    for (const file of [
      '001_catalogo.sql',
      '003_carrito_pedidos.sql',
      '007_permisos.sql',
      '012_cart_atomic.sql',
    ]) {
      await db.exec(
        await readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8'),
      )
    }
    await db.exec(`INSERT INTO profiles VALUES('${USER}'),('${OTHER}');
      INSERT INTO categories(id,name,slug) VALUES(1,'Audio','audio');
      INSERT INTO products(id,category_id,name,slug,price) VALUES(1,1,'Micro','micro',10);
      INSERT INTO product_variants(id,product_id,name,sku,stock) VALUES(1,1,'Único','MIC',5),(2,1,'Otro','MIC2',2);`)
  }, 30000)
  afterAll(async () => {
    await db?.close()
  })
  beforeEach(async () => {
    await db.exec(
      'DELETE FROM cart_items; DELETE FROM cart_merge_requests; UPDATE products SET active=true; UPDATE product_variants SET stock=5;',
    )
  })
  it('reemplaza y vacía solo el carrito indicado como service_role', async () => {
    await save([{ variant_id: '2', quantity: 1 }], null, OTHER)
    await db.exec('SET ROLE service_role')
    try {
      await save([{ variant_id: '1', quantity: 2 }])
      expect(await cart()).toEqual([{ variant_id: '1', quantity: 2 }])
      await save([])
      expect(await cart()).toEqual([])
      expect(await cart(OTHER)).toHaveLength(1)
    } finally {
      await db.exec('RESET ROLE')
    }
  })
  it.each([
    [{ variant_id: '999', quantity: 1 }],
    [{ variant_id: '1', quantity: 0 }],
    [{ variant_id: '1', quantity: 1.5 }],
    [{ variant_id: '1', quantity: 2147483648 }],
    [
      { variant_id: '1', quantity: 1 },
      { variant_id: '1', quantity: 2 },
    ],
  ])('rechaza datos inválidos sin perder el carrito %j', async (...items) => {
    await save([{ variant_id: '2', quantity: 2 }])
    await expect(save(items)).rejects.toBeDefined()
    expect(await cart()).toEqual([{ variant_id: '2', quantity: 2 }])
  })
  it('rechaza stock excesivo y productos inactivos antes de reemplazar', async () => {
    await save([{ variant_id: '2', quantity: 1 }])
    await expect(save([{ variant_id: '1', quantity: 6 }])).rejects.toMatchObject({ code: 'FT003' })
    await db.exec('UPDATE products SET active=false')
    await expect(save([{ variant_id: '1', quantity: 1 }])).rejects.toMatchObject({ code: 'FT003' })
    expect(await cart()).toEqual([{ variant_id: '2', quantity: 1 }])
  })
  it('revierte el borrado si la inserción falla dentro de la transacción', async () => {
    await save([{ variant_id: '2', quantity: 1 }])
    await db.exec(`CREATE FUNCTION test_cart_failure() RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN IF NEW.quantity=3 THEN RAISE EXCEPTION 'Fallo de prueba'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER test_cart_failure BEFORE INSERT ON cart_items FOR EACH ROW EXECUTE FUNCTION test_cart_failure();`)
    try {
      await expect(save([{ variant_id: '1', quantity: 3 }])).rejects.toThrow('Fallo de prueba')
      expect(await cart()).toEqual([{ variant_id: '2', quantity: 1 }])
    } finally {
      await db.exec(
        'DROP TRIGGER test_cart_failure ON cart_items; DROP FUNCTION test_cart_failure()',
      )
    }
  })
  it('fusiona hasta el stock y reintentar el mismo merge no duplica', async () => {
    await save([{ variant_id: '1', quantity: 3 }])
    await save([{ variant_id: '1', quantity: 4 }], MERGE)
    expect(await cart()).toEqual([{ variant_id: '1', quantity: 5 }])
    await save([{ variant_id: '1', quantity: 2 }])
    await save([{ variant_id: '1', quantity: 4 }], MERGE)
    expect(await cart()).toEqual([{ variant_id: '1', quantity: 2 }])
  })
  it('omite agotados al fusionar y no consume la clave de un merge fallido', async () => {
    await expect(save([{ variant_id: '999', quantity: 1 }], MERGE)).rejects.toMatchObject({
      code: 'FT004',
    })
    await db.exec('UPDATE product_variants SET stock=0 WHERE id=2')
    await save(
      [
        { variant_id: '1', quantity: 1 },
        { variant_id: '2', quantity: 2 },
      ],
      MERGE,
    )
    expect(await cart()).toEqual([{ variant_id: '1', quantity: 1 }])
  })
  it.each(['anon', 'authenticated'])('no permite RPC ni claves de merge a %s', async (role) => {
    await db.exec(`SET ROLE ${role}`)
    try {
      await expect(save([])).rejects.toMatchObject({ code: '42501' })
      await expect(db.query('SELECT * FROM cart_merge_requests')).rejects.toMatchObject({
        code: '42501',
      })
    } finally {
      await db.exec('RESET ROLE')
    }
  })
})
