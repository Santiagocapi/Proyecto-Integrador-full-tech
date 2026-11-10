import { beforeEach } from 'vitest'

const storage = new Map()

const localStorageMock = {
  getItem(key) {
    return storage.has(String(key)) ? storage.get(String(key)) : null
  },

  setItem(key, value) {
    storage.set(String(key), String(value))
  },

  removeItem(key) {
    storage.delete(String(key))
  },

  clear() {
    storage.clear()
  },

  get length() {
    return storage.size
  },

  key(index) {
    return [...storage.keys()][index] ?? null
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: localStorageMock,
})

beforeEach(() => {
  localStorageMock.clear()
})
