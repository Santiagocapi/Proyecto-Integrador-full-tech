import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { api } from '@/services/api'

const KEY = 'full-tech-cart'
function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* El carrito en memoria sigue disponible si el navegador bloquea el almacenamiento. */
  }
}
function normalize(items) {
  if (!Array.isArray(items)) return []
  return items
    .filter(
      (item) =>
        item &&
        /^[1-9]\d*$/.test(String(item.variantId)) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(Number(item.price)),
    )
    .map((item) => ({ ...item, variantId: String(item.variantId), price: Number(item.price) }))
}
function restore() {
  try {
    return normalize(JSON.parse(read(KEY) ?? '[]'))
  } catch {
    return []
  }
}
const payload = (items) => items.map(({ variantId, quantity }) => ({ variantId, quantity }))

export const useCartStore = defineStore('cart', () => {
  const items = ref(restore())
  const isOpen = ref(false)
  const isSyncing = ref(false)
  const syncError = ref('')
  let owner = read(`${KEY}-owner`)
  let sessionUser = null
  let syncedUser = null
  let generation = 0
  let revision = 0
  let applying = false
  let initPromise = null
  let queue = Promise.resolve()

  function persist() {
    write(KEY, JSON.stringify(items.value))
    write(`${KEY}-owner`, owner)
  }
  function applyServer(value) {
    applying = true
    items.value = normalize(value.data ?? value)
    applying = false
    persist()
  }
  function save() {
    const epoch = generation
    const version = revision
    const userId = syncedUser
    const snapshot = payload(items.value)
    queue = queue.then(async () => {
      if (epoch !== generation || !userId || userId !== syncedUser) return
      try {
        const response = await api.put('/cart', { items: snapshot }, { auth: true, userId })
        if (epoch !== generation) return
        if (version === revision) applyServer(response)
        syncError.value = ''
      } catch (error) {
        if (epoch === generation) syncError.value = error.message || 'No se pudo guardar el carrito'
      }
    })
  }
  watch(
    items,
    () => {
      if (applying) return
      revision++
      persist()
      if (syncedUser) save()
    },
    { deep: true, flush: 'sync' },
  )

  async function flushSync() {
    if (initPromise) await initPromise
    let pending
    do {
      pending = queue
      await pending
    } while (pending !== queue)
    if (syncError.value) throw new Error(syncError.value)
  }
  function stopCartSync() {
    generation++
    syncedUser = sessionUser = owner = null
    initPromise = null
    isSyncing.value = false
    syncError.value = ''
    queue = Promise.resolve()
    applyServer([])
    isOpen.value = false
    write(KEY, null)
    write(`${KEY}-merge-id`, null)
  }
  function resetForGuest() {
    if (owner || sessionUser) stopCartSync()
  }
  async function initCartSync(userId) {
    if (!userId) return resetForGuest()
    if (sessionUser === userId && initPromise) return initPromise
    if (syncedUser === userId) return flushSync()
    if ((owner && owner !== userId) || (sessionUser && sessionUser !== userId)) stopCartSync()
    sessionUser = userId
    const epoch = ++generation
    isSyncing.value = true
    syncError.value = ''
    const guests = owner ? [] : payload(items.value)
    initPromise = (async () => {
      try {
        let response
        if (guests.length) {
          // Reutilizar esta clave permite reintentar una respuesta perdida sin sumar dos veces.
          const mergeId = read(`${KEY}-merge-id`) ?? crypto.randomUUID()
          write(`${KEY}-merge-id`, mergeId)
          response = await api.post(
            '/cart/merge',
            { items: guests, mergeId },
            { auth: true, userId },
          )
        } else {
          response = await api.get('/cart', { auth: true, userId })
        }
        if (epoch !== generation) return
        owner = syncedUser = userId
        applyServer(response)
        write(`${KEY}-merge-id`, null)
      } catch (error) {
        if (epoch === generation)
          syncError.value = error.message || 'No se pudo recuperar el carrito'
      } finally {
        if (epoch === generation) {
          initPromise = null
          isSyncing.value = false
        }
      }
    })()
    return initPromise
  }
  async function retrySync() {
    if (!sessionUser) return
    if (!syncedUser) await initCartSync(sessionUser)
    else {
      save()
      await flushSync()
    }
  }
  function checkQuantity(item, quantity) {
    if (isSyncing.value || (sessionUser && !syncedUser))
      throw new Error('Esperá o reintentá la sincronización del carrito')
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647)
      throw new Error('Cantidad inválida')
    if (item.stock != null && quantity > item.stock)
      throw new Error(`Solo quedan ${item.stock} unidades disponibles`)
  }
  function addItem(product, quantity = 1) {
    const id = String(product.variantId)
    if (!/^[1-9]\d*$/.test(id)) throw new Error('Variante inválida')
    const existing = items.value.find((item) => item.variantId === id)
    const total = (existing?.quantity ?? 0) + quantity
    checkQuantity(product, total)
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Cantidad inválida')
    if (existing) {
      checkQuantity(existing, total)
      existing.quantity = total
    } else items.value.push({ ...product, variantId: id, quantity })
  }
  function updateQuantity(variantId, quantity) {
    const item = items.value.find((value) => value.variantId === String(variantId))
    if (!item) return
    checkQuantity(item, quantity)
    item.quantity = quantity
  }
  function removeItem(variantId) {
    if (isSyncing.value) return
    items.value = items.value.filter((item) => item.variantId !== String(variantId))
  }
  function clearCart() {
    items.value = []
  }
  return {
    items,
    isOpen,
    isSyncing,
    syncError,
    count: computed(() => items.value.reduce((total, item) => total + item.quantity, 0)),
    subtotal: computed(() =>
      items.value.reduce((total, item) => total + item.price * item.quantity, 0),
    ),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    clear: clearCart,
    open: () => {
      isOpen.value = true
    },
    close: () => {
      isOpen.value = false
    },
    toggleCart: () => {
      isOpen.value = !isOpen.value
    },
    initCartSync,
    stopCartSync,
    resetForGuest,
    flushSync,
    retrySync,
  }
})
