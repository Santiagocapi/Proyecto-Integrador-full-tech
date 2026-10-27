import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import SearchBox from './SearchBox.vue'
import { api } from '@/services/api'

vi.mock('@/services/api', () => ({ api: { get: vi.fn() } }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))

describe('Sugerencias del buscador', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.resetAllMocks() })
  afterEach(() => vi.useRealTimers())

  it('descarta una respuesta vieja mientras espera buscar el texto nuevo', async () => {
    let resolveOld
    api.get.mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve }))
    const wrapper = mount(SearchBox)
    await wrapper.get('input').setValue('micro')
    await vi.advanceTimersByTimeAsync(300)
    await wrapper.get('input').setValue('luces')
    resolveOld({ items: [{ slug: 'micro', name: 'Micrófono', price: 100 }] })
    await flushPromises()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
