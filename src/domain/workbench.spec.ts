import { describe, expect, it } from 'vitest'
import {
  addStatusOption,
  confirmDailyRecord,
  ensureDailyRecord,
  mayEditDailyRecord,
  removeStatusOption,
  submitDailyRecord,
  updateEntryNote,
  updateEntryStatus,
  type DailyRecord,
} from './workbench'

const today = '2026-11-13'
const people = [{ id: 'jia-1', groupId: 'jia', activeFrom: '2026-01-01' }]

function draftRecord(): DailyRecord {
  return ensureDailyRecord({ records: [], groupId: 'jia', date: today, people, plannedShift: () => 'day' }).record
}

describe('attendance workbench', () => {
  it('creates a planned-shift snapshot once and keeps it after the planning rule changes', () => {
    const initial = ensureDailyRecord({ records: [], groupId: 'jia', date: today, people, plannedShift: () => 'day' })
    const later = ensureDailyRecord({ records: initial.records, groupId: 'jia', date: today, people, plannedShift: () => 'night' })

    expect(later.record.entries[0].planned).toBe('day')
    expect(later.records).toBe(initial.records)
  })

  it('accepts group edits while draft and rejects them after submission', () => {
    const draft = draftRecord()
    const updated = updateEntryStatus({ records: [draft], access: { type: 'group-link', groupId: 'jia' }, groupId: 'jia', date: today, today, personId: 'jia-1', status: 'sick-leave' })
    expect(updated).toMatchObject({ ok: true })
    if (!updated.ok) return

    const submitted = submitDailyRecord({ records: updated.value, access: { type: 'group-link', groupId: 'jia' }, groupId: 'jia', date: today, today })
    expect(submitted).toMatchObject({ ok: true })
    if (!submitted.ok) return

    expect(mayEditDailyRecord({ type: 'group-link', groupId: 'jia' }, submitted.value[0], today)).toBe(false)
    expect(updateEntryNote({ records: submitted.value, access: { type: 'group-link', groupId: 'jia' }, groupId: 'jia', date: today, today, personId: 'jia-1', note: '补充说明' })).toEqual({ ok: false, message: '当前无权修改该考勤记录' })
    expect(mayEditDailyRecord({ type: 'admin' }, submitted.value[0], today)).toBe(true)
  })

  it('lets an administrator confirm and maintains status fallback when deleting a status', () => {
    const draft = draftRecord()
    const options = [{ value: 'normal', label: '正常出勤' }, { value: 'training', label: '培训' }]
    const changed = updateEntryStatus({ records: [draft], access: { type: 'admin' }, groupId: 'jia', date: today, today, personId: 'jia-1', status: 'training' })
    expect(changed).toMatchObject({ ok: true })
    if (!changed.ok) return

    const removed = removeStatusOption({ records: changed.value, options, access: { type: 'admin' }, value: 'training' })
    expect(removed).toMatchObject({ ok: true })
    if (!removed.ok) return
    expect(removed.value.records[0].entries[0].status).toBe('normal')
    expect(removed.value.options).toEqual([{ value: 'normal', label: '正常出勤' }])
    expect(confirmDailyRecord(removed.value.records, { type: 'admin' }, 'jia', today)).toMatchObject({ ok: true })
    expect(addStatusOption(removed.value.options, { type: 'group-link', groupId: 'jia' }, '外出', 'fieldwork')).toEqual({ ok: false, message: '仅管理员可维护考勤状态' })
  })
})
