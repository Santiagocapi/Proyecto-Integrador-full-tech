import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth'
import { api } from '@/services/api'
import { supabase } from '@/lib/supabase'

vi.mock('@/services/api', () => ({ api: { get: vi.fn() } }))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { signOut: vi.fn() } } }))
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
describe('Perfiles asíncronos', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
    supabase.auth.signOut.mockResolvedValue({ error: null })
  })
  it('descarta un perfil pendiente tras cerrar sesión', async () => {
    const store = useAuthStore()
    store.user = { id: 'A' }
    const pending = deferred()
    api.get.mockReturnValue(pending.promise)
    const fetch = store.fetchProfile()
    await store.logout()
    pending.resolve({ id: 'A', role: 'admin' })
    await fetch
    expect(store.profile).toBeNull()
    expect(store.isAdmin).toBe(false)
  })
  it('descarta perfil de A al cambiar a B', async () => {
    const store = useAuthStore()
    store.user = { id: 'A' }
    const pending = deferred()
    api.get
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ id: 'B', role: 'comprador' })
    const fetch = store.fetchProfile()
    store.user = { id: 'B' }
    await store.fetchProfile()
    pending.resolve({ id: 'A', role: 'admin' })
    await fetch
    expect(store.profile.id).toBe('B')
    expect(store.isAdmin).toBe(false)
  })
  it('un error viejo no borra el perfil nuevo', async () => {
    const store = useAuthStore()
    store.user = { id: 'A' }
    const pending = deferred()
    api.get.mockReturnValueOnce(pending.promise).mockResolvedValueOnce({ id: 'A', role: 'admin' })
    const fetch = store.fetchProfile()
    await store.fetchProfile()
    pending.reject(new Error('old'))
    await fetch
    expect(store.isAdmin).toBe(true)
  })
  it('no concede administración a perfiles de otra cuenta', () => {
    const store = useAuthStore()
    store.user = { id: 'B' }
    store.profile = { id: 'A', role: 'admin' }
    expect(store.isAdmin).toBe(false)
  })
})
