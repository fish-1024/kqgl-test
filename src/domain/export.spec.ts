import { describe, expect, it } from 'vitest'
import { buildExportCell, createExportVersion } from './export'

describe('attendance export', () => {
  it('uses actual shifts for adjustments and stamps an export version', () => {
    expect(buildExportCell({ plannedShift: 'rest', actualStatus: 'top-up', actualShift: 'night' })).toBe('夜')
    expect(buildExportCell({ plannedShift: 'day', actualStatus: 'swap', actualShift: 'swing' })).toBe('中')
    expect(buildExportCell({ plannedShift: 'day', actualStatus: 'sick-leave' })).toBe('病')

    expect(createExportVersion('2026-11', 3)).toBe('2026-11-V003')
  })
})
