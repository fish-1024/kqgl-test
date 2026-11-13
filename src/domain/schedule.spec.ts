import { describe, expect, it } from 'vitest'
import { getBasePlannedShift, getFixedFourTeamShift, getFixedFourTeamShiftFromReference, getPlannedShift } from './schedule'

describe('getPlannedShift', () => {
  it('uses the active eight-day rule and gives personal adjustments priority', () => {
    const plan = getPlannedShift({
      date: '2026-11-13',
      group: { id: 'jia', cyclePosition: 1 },
      rules: [
        {
          effectiveFrom: '2026-11-01',
          cycle: ['night', 'night', 'day', 'day', 'swing', 'swing', 'rest', 'rest'],
        },
      ],
      groupAdjustments: [{ date: '2026-11-13', shift: 'swing', reason: '设备检修' }],
      personAdjustments: [{ date: '2026-11-13', personId: 'zhang', shift: 'day', reason: '临时调班' }],
      personId: 'zhang',
    })

    expect(plan).toEqual({ shift: 'day', source: 'person-adjustment' })
  })
})

describe('four-team fixed rotation', () => {
  it('matches the confirmed 2026-11-01 sequence', () => {
    expect(getFixedFourTeamShift('2026-11-01', '2026-11-01')).toBe('night')
    expect(getFixedFourTeamShift('2026-11-07', '2026-11-01')).toBe('day')
    expect(getFixedFourTeamShift('2026-11-05', '2026-11-01')).toBe('swing')
    expect(getFixedFourTeamShift('2026-11-03', '2026-11-01')).toBe('rest')

    expect(getFixedFourTeamShift('2026-11-03', '2026-11-03')).toBe('night')
    expect(getFixedFourTeamShift('2026-11-01', '2026-11-03')).toBe('day')
    expect(getFixedFourTeamShift('2026-11-07', '2026-11-03')).toBe('swing')
    expect(getFixedFourTeamShift('2026-11-05', '2026-11-03')).toBe('rest')
  })

  it('derives the confirmed sequence from one known reference day', () => {
    expect(getFixedFourTeamShiftFromReference('2026-11-01', 1, '2026-11-01')).toBe('night')
    expect(getFixedFourTeamShiftFromReference('2026-11-01', 3, '2026-11-01')).toBe('day')
    expect(getFixedFourTeamShiftFromReference('2026-11-01', 5, '2026-11-01')).toBe('swing')
    expect(getFixedFourTeamShiftFromReference('2026-11-01', 7, '2026-11-01')).toBe('rest')
    expect(getFixedFourTeamShiftFromReference('2026-11-01', 1, '2026-11-03')).toBe('day')
  })
})

describe('base planned shift', () => {
  it('plans the confirmed four-team reference day through one interface', () => {
    const referenceDate = '2026-11-01'

    expect(getBasePlannedShift({ group: { id: 'bing', scheduleType: 'rotating', referencePosition: 1 }, referenceDate, date: referenceDate })).toBe('night')
    expect(getBasePlannedShift({ group: { id: 'jia', scheduleType: 'rotating', referencePosition: 3 }, referenceDate, date: referenceDate })).toBe('day')
    expect(getBasePlannedShift({ group: { id: 'ding', scheduleType: 'rotating', referencePosition: 5 }, referenceDate, date: referenceDate })).toBe('swing')
    expect(getBasePlannedShift({ group: { id: 'yi', scheduleType: 'rotating', referencePosition: 7 }, referenceDate, date: referenceDate })).toBe('rest')
  })

  it('gives weekday groups day shifts only on working days', () => {
    const group = { id: 'changbai', scheduleType: 'weekday' as const }

    expect(getBasePlannedShift({ group, referenceDate: '2026-11-01', date: '2026-11-13' })).toBe('day')
    expect(getBasePlannedShift({ group, referenceDate: '2026-11-01', date: '2026-11-14' })).toBe('rest')
    expect(getBasePlannedShift({ group, referenceDate: '2026-11-01', date: '2026-10-01' })).toBe('rest')
  })
})
