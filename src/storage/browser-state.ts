export interface BrowserKeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

interface VersionedState<T> {
  version: number
  state: T
}

export function createBrowserStateStore<T>(input: {
  storage: BrowserKeyValueStore
  key: string
  legacyKeys: string[]
  version: number
  createDefaultState: () => T
  isState: (value: unknown) => value is T
}) {
  const backupKey = `${input.key}-recovery`

  function restoreDefault(raw: string | null): T {
    if (raw !== null) input.storage.setItem(backupKey, raw)
    return input.createDefaultState()
  }

  function load(): T {
    const stored = [input.key, ...input.legacyKeys]
      .map((key) => input.storage.getItem(key))
      .find((raw): raw is string => raw !== null)
    if (stored === undefined) return input.createDefaultState()

    try {
      const parsed: unknown = JSON.parse(stored)
      if (input.isState(parsed)) return parsed
      if (isVersionedState(parsed) && parsed.version <= input.version && input.isState(parsed.state)) return parsed.state
      return restoreDefault(stored)
    } catch {
      return restoreDefault(stored)
    }
  }

  function save(state: T): void {
    const payload: VersionedState<T> = { version: input.version, state }
    input.storage.setItem(input.key, JSON.stringify(payload))
  }

  return { load, save, backupKey }
}

function isVersionedState(value: unknown): value is VersionedState<unknown> {
  return typeof value === 'object'
    && value !== null
    && 'version' in value
    && typeof value.version === 'number'
    && 'state' in value
}
