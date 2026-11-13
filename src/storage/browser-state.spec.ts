import { describe, expect, it } from 'vitest'
import { createBrowserStateStore } from './browser-state'

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

describe('browser state store', () => {
  const defaults = () => ({ count: 0 })
  const isState = (value: unknown): value is { count: number } => typeof value === 'object' && value !== null && 'count' in value && typeof value.count === 'number'

  it('loads the existing legacy state and saves a versioned state', () => {
    const storage = memoryStorage({ legacy: JSON.stringify({ count: 2 }) })
    const store = createBrowserStateStore({ storage, key: 'current', legacyKeys: ['legacy'], version: 1, createDefaultState: defaults, isState })

    expect(store.load()).toEqual({ count: 2 })
    store.save({ count: 3 })
    expect(storage.getItem('current')).toBe(JSON.stringify({ version: 1, state: { count: 3 } }))
  })

  it('loads a versioned state and backs up invalid data before recovering', () => {
    const storage = memoryStorage({ current: '{bad json' })
    const store = createBrowserStateStore({ storage, key: 'current', legacyKeys: ['legacy'], version: 1, createDefaultState: defaults, isState })

    expect(store.load()).toEqual({ count: 0 })
    expect(storage.getItem(store.backupKey)).toBe('{bad json')

    storage.setItem('current', JSON.stringify({ version: 1, state: { count: 4 } }))
    expect(store.load()).toEqual({ count: 4 })
  })
})
