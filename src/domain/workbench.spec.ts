import { describe, expect, it } from 'vitest'
import { addStatusOption, ensureDailyRecord, removeStatusOption, submitDailyRecord, updateEntryNote, updateEntryStatus, type DailyRecord } from './workbench'

const today = '2026-11-13'
const people = [{ id: 'jia-1', groupId: 'jia', activeFrom: '2026-01-01' }]
const draftRecord = (): DailyRecord => ensureDailyRecord({ records: [], groupId: 'jia', date: today, people, plannedShift: () => 'day' }).record

describe('attendance workbench', () => {
  it('creates a planned-shift snapshot once and keeps it after the planning rule changes', () => {
    const initial = ensureDailyRecord({ records: [], groupId: 'jia', date: today, people, plannedShift: () => 'day' })
    const later = ensureDailyRecord({ records: initial.records, groupId: 'jia', date: today, people, plannedShift: () => 'night' })
    expect(later.record.entries[0].planned).toBe('day')
    expect(later.records).toBe(initial.records)
  })

  it('allows an administrator to update and submit a daily record', () => {
    const updated = updateEntryStatus({ records: [draftRecord()], groupId: 'jia', date: today, personId: 'jia-1', status: 'sick-leave' })
    expect(updated).toMatchObject({ ok: true })
    if (!updated.ok) return
    const submitted = submitDailyRecord({ records: updated.value, groupId: 'jia', date: today })
    expect(submitted).toMatchObject({ ok: true })
    if (!submitted.ok) return
    expect(updateEntryNote({ records: submitted.value, groupId: 'jia', date: today, personId: 'jia-1', note: '补充说明' })).toMatchObject({ ok: true })
  })

  it('confirms records and maintains status fallback when deleting a status', () => {
    const options = [{ value: 'normal', label: '正常出勤' }, { value: 'training', label: '培训' }]
    const changed = updateEntryStatus({ records: [draftRecord()], groupId: 'jia', date: today, personId: 'jia-1', status: 'training' })
    expect(changed).toMatchObject({ ok: true })
    if (!changed.ok) return
    const removed = removeStatusOption({ records: changed.value, options, value: 'training' })
    expect(removed).toMatchObject({ ok: true })
    if (!removed.ok) return
    expect(removed.value.records[0].entries[0].status).toBe('normal')
    expect(addStatusOption(removed.value.options, '外出', 'fieldwork')).toMatchObject({ ok: true })
  })
})
