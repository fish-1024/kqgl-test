import { describe, expect, it } from 'vitest'
import { canEditRecord, canViewGroup } from './access'

describe('link access', () => {
  it('limits a group link to its group and the current attendance date', () => {
    expect(canViewGroup({ type: 'group-link', groupId: 'jia' }, 'jia')).toBe(true)
    expect(canViewGroup({ type: 'group-link', groupId: 'jia' }, 'yi')).toBe(false)
    expect(canViewGroup({ type: 'admin' }, 'yi')).toBe(true)

    expect(canEditRecord({ type: 'group-link', groupId: 'jia' }, 'jia', '2026-11-13', '2026-11-13')).toBe(true)
    expect(canEditRecord({ type: 'group-link', groupId: 'jia' }, 'jia', '2026-11-12', '2026-11-13')).toBe(false)
  })
})
