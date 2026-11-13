import { describe, expect, it } from 'vitest'
import { lockMonth } from './attendance'

describe('lockMonth', () => {
  it('rejects a month with unsubmitted records and locks a complete month', () => {
    expect(() =>
      lockMonth([
        { date: '2026-11-01', status: 'confirmed', hasUnresolvedException: false },
        { date: '2026-11-02', status: 'draft', hasUnresolvedException: false },
      ]),
    ).toThrow('存在未提交记录')

    expect(
      lockMonth([
        { date: '2026-11-01', status: 'confirmed', hasUnresolvedException: false },
        { date: '2026-11-02', status: 'confirmed', hasUnresolvedException: false },
      ]),
    ).toEqual([
      { date: '2026-11-01', status: 'locked', hasUnresolvedException: false },
      { date: '2026-11-02', status: 'locked', hasUnresolvedException: false },
    ])
  })
})
