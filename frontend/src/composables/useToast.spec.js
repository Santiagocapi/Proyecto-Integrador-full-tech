import { afterEach, describe, expect, it, vi } from 'vitest'
import { useToast } from './useToast'
afterEach(() => {
  vi.useRealTimers()
})
describe('Notificaciones simultáneas', () => {
  it('cada aviso tiene identidad propia y se cierra sin quitar los demás', () => {
    vi.useFakeTimers()
    const toast = useToast()
    toast.success('Guardado')
    toast.error('Sin stock')
    expect(toast.toasts.value).toHaveLength(2)
    toast.removeToast(toast.toasts.value[0].id)
    expect(toast.toasts.value.map((item) => item.message)).toEqual(['Sin stock'])
    vi.runAllTimers()
    expect(toast.toasts.value).toEqual([])
  })
})
