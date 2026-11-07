import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import OrderSummary from './OrderSummary.vue'
import { formatPrice } from '@/utils/format'

const items = [
  { variantId: 1, productId: 1, name: 'Micrófono', variantName: 'Único', price: 1000, image: '', quantity: 2 },
  { variantId: 2, productId: 2, name: 'Aro de luz', variantName: 'Negro', price: 500, image: '', quantity: 1 },
]

const mountSummary = (props = {}) =>
  mount(OrderSummary, { props: { items, subtotal: 2500, loading: false, ...props } })

describe('OrderSummary', () => {
  it('muestra ítems, totales de línea, subtotal, envío gratis y total', () => {
    const text = mountSummary().text()
    expect(text).toContain('Micrófono')
    expect(text).toContain('Aro de luz')
    expect(text).toContain('Negro')
    expect(text).toContain(formatPrice(2000))
    expect(text).toContain(formatPrice(2500))
    expect(text).toContain('Gratis')
    expect(text).toContain('Total')
  })

  it('oculta la variante "Único"', () => {
    expect(mountSummary().text()).not.toContain('Único')
  })

  it('emite confirm al hacer clic en el botón', async () => {
    const wrapper = mountSummary()
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('deshabilita el botón y muestra "Procesando..." mientras carga', () => {
    const button = mountSummary({ loading: true }).get('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toContain('Procesando...')
  })
})
