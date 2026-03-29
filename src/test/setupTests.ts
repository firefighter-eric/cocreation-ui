import '@testing-library/jest-dom'

const storage = new Map<string, string>()

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    clear() {
      storage.clear()
    },
    getItem(key: string) {
      return storage.has(key) ? storage.get(key)! : null
    },
    key(index: number) {
      return [...storage.keys()][index] ?? null
    },
    get length() {
      return storage.size
    },
    removeItem(key: string) {
      storage.delete(key)
    },
    setItem(key: string, value: string) {
      storage.set(key, String(value))
    },
  } satisfies Storage,
})
