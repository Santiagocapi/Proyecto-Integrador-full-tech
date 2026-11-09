import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ShippingForm from './ShippingForm.vue'

const validShipping = () => ({
  name: 'Ana Pérez',
  address: 'Av. Siempre Viva 742',
  city: 'Córdoba',
  zip: '5000',
  phone: '+54 351 555-1234',
})

const mountForm = (shipping) => mount(ShippingForm, { props: { modelValue: shipping } })

describe('ShippingForm', () => {
  it('valida un envío completo y correcto', () => {
    const wrapper = mountForm(validShipping())
    expect(wrapper.vm.validate()).toBe(true)
  })

  it('acepta un CPA argentino en mayúsculas', () => {
    const wrapper = mountForm({ ...validShipping(), zip: 'C1425ABC' })
    expect(wrapper.vm.validate()).toBe(true)
  })

  it('marca los campos vacíos como obligatorios', async () => {
    const wrapper = mountForm({ name: '', address: '', city: '', zip: '', phone: '' })
    expect(wrapper.vm.validate()).toBe(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(5)
  })

  it('rechaza un código postal inválido', async () => {
    const wrapper = mountForm({ ...validShipping(), zip: '12' })
    expect(wrapper.vm.validate()).toBe(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('código postal')
  })

  it('rechaza un teléfono inválido', async () => {
    const wrapper = mountForm({ ...validShipping(), phone: 'abc' })
    expect(wrapper.vm.validate()).toBe(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('teléfono')
  })

  it('rechaza un nombre de más de 120 caracteres', () => {
    const wrapper = mountForm({ ...validShipping(), name: 'a'.repeat(121) })
    expect(wrapper.vm.validate()).toBe(false)
  })

  it('emite el objeto actualizado al escribir', async () => {
    const wrapper = mountForm(validShipping())
    await wrapper.findAll('input')[2].setValue('Rosario')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted.at(-1)[0].city).toBe('Rosario')
  })
})
