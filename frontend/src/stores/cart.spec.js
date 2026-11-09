import { beforeEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import { useCartStore } from './cart'
import { api } from '@/services/api'
vi.mock('@/services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))
const item = (quantity = 1) => ({
  variantId: '1',
  productId: '1',
  price: 10,
  name: 'Micro',
  stock: 5,
  quantity,
})
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.resetAllMocks()
  api.get.mockResolvedValue([])
  api.put.mockImplementation(async (_path, body) => body.items.map((i) => ({ ...item(), ...i })))
})
describe('Carrito persistente y sesiones', () => {
  it('agrega, suma, calcula subtotal, persiste y elimina por id normalizado', () => {
    const cart = useCartStore()
    cart.addItem({ ...item(), variantId: 1 }, 2)
    cart.addItem(item(), 1)
    expect(cart.count).toBe(3)
    expect(cart.subtotal).toBe(30)
    setActivePinia(createPinia())
    expect(useCartStore().count).toBe(3)
    cart.removeItem(1)
    expect(cart.items).toEqual([])
  })
  it('recupera almacenamiento inválido y rechaza cantidad mayor al stock', () => {
    localStorage.setItem('full-tech-cart', 'roto')
    const cart = useCartStore()
    expect(cart.items).toEqual([])
    cart.addItem(item(), 2)
    expect(() => cart.updateQuantity(1, 9)).toThrow('disponibles')
    expect(() => cart.addItem(item(), 4)).toThrow('disponibles')
    expect(cart.count).toBe(2)
  })
  it('fusiona una vez y al recargar una cuenta consulta sin volver a sumar', async () => {
    const cart = useCartStore()
    cart.addItem(item(), 2)
    api.post.mockResolvedValue([item(5)])
    await cart.initCartSync('A')
    await cart.initCartSync('A')
    setActivePinia(createPinia())
    api.get.mockResolvedValue([item(5)])
    await useCartStore().initCartSync('A')
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.put).not.toHaveBeenCalled()
    expect(useCartStore().count).toBe(5)
  })
  it('reutiliza la clave al reintentar un merge cuya respuesta se perdió', async () => {
    const cart = useCartStore()
    cart.addItem(item(), 1)
    api.post.mockRejectedValueOnce(new Error('sin conexión')).mockResolvedValueOnce([item(3)])
    await cart.initCartSync('A')
    await cart.retrySync()
    expect(api.post.mock.calls[0][1].mergeId).toBe(api.post.mock.calls[1][1].mergeId)
    expect(cart.count).toBe(3)
  })
  it('conserva un cambio si se recarga antes de recibir la confirmación de guardado', async () => {
    const cart = useCartStore()
    api.get.mockResolvedValue([item(1)])
    await cart.initCartSync('A')
    const pending = deferred()
    api.put.mockReturnValueOnce(pending.promise)
    cart.updateQuantity(1, 2)
    await flushPromises()
    setActivePinia(createPinia())
    const reloaded = useCartStore()
    await reloaded.initCartSync('A')
    expect(api.get).toHaveBeenCalledTimes(1)
    expect(api.put.mock.calls[1][1]).toEqual({ items: [{ variantId: '1', quantity: 2 }] })
    expect(reloaded.count).toBe(2)
    expect(localStorage.getItem('full-tech-cart-dirty')).toBeNull()
    pending.resolve([item(2)])
    await flushPromises()
  })
  it('cierra sesión sin borrar la BD ni conservar productos de otra cuenta', async () => {
    const cart = useCartStore()
    api.get.mockResolvedValue([item(2)])
    await cart.initCartSync('A')
    cart.stopCartSync()
    expect(cart.items).toEqual([])
    expect(localStorage.getItem('full-tech-cart')).toBeNull()
    api.get.mockResolvedValue([])
    await cart.initCartSync('B')
    expect(api.post).not.toHaveBeenCalled()
    expect(api.put).not.toHaveBeenCalled()
  })
  it('ignora una carga antigua que llega después de salir de la cuenta', async () => {
    const pending = deferred()
    api.get.mockReturnValue(pending.promise)
    const cart = useCartStore()
    const init = cart.initCartSync('A')
    cart.stopCartSync()
    pending.resolve([item(3)])
    await init
    expect(cart.items).toEqual([])
  })
  it('serializa guardados y no pisa una cantidad más nueva con una respuesta vieja', async () => {
    const cart = useCartStore()
    api.get.mockResolvedValue([item(1)])
    await cart.initCartSync('A')
    const first = deferred()
    api.put.mockReturnValueOnce(first.promise)
    cart.updateQuantity(1, 2)
    await flushPromises()
    cart.updateQuantity(1, 3)
    expect(api.put).toHaveBeenCalledTimes(1)
    first.resolve([item(2)])
    await cart.flushSync()
    expect(api.put).toHaveBeenCalledTimes(2)
    expect(cart.count).toBe(3)
  })
  it('muestra el error de guardado y permite reintentar antes de comprar', async () => {
    const cart = useCartStore()
    api.get.mockResolvedValue([item(1)])
    await cart.initCartSync('A')
    api.put.mockRejectedValueOnce(new Error('Stock insuficiente'))
    cart.updateQuantity(1, 2)
    await expect(cart.flushSync()).rejects.toThrow('Stock insuficiente')
    await cart.retrySync()
    expect(cart.syncError).toBe('')
  })
  it('descarta escrituras en cola y respuestas de A cuando se inicia B', async () => {
    const cart = useCartStore()
    api.get.mockResolvedValue([item(1)])
    await cart.initCartSync('A')
    const pending = deferred()
    api.put.mockReturnValueOnce(pending.promise)
    cart.updateQuantity(1, 2)
    await flushPromises()
    cart.updateQuantity(1, 3)
    cart.stopCartSync()
    api.get.mockResolvedValue([])
    await cart.initCartSync('B')
    pending.resolve([item(2)])
    await flushPromises()
    expect(api.put).toHaveBeenCalledTimes(1)
    expect(cart.items).toEqual([])
  })
})
