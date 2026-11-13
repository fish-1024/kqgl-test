import type { Shift } from './schedule'

export type ActualStatus = string
export type RecordStatus = 'draft' | 'submitted' | 'confirmed'
export interface AttendanceEntry { personId: string; planned: Shift; status: ActualStatus; actualShift?: Shift; note: string }
export interface DailyRecord { groupId: string; date: string; status: RecordStatus; note: string; entries: AttendanceEntry[] }
export interface StatusOption { value: string; label: string }
export interface AttendancePerson { id: string; groupId: string; activeFrom: string }

type Result<T> = { ok: true; value: T } | { ok: false; message: string }
const succeed = <T>(value: T): Result<T> => ({ ok: true, value })
const fail = <T>(message: string): Result<T> => ({ ok: false, message })
const replaceRecord = (records: DailyRecord[], next: DailyRecord): DailyRecord[] => records.map((record) => record.groupId === next.groupId && record.date === next.date ? next : record)

function updateRecord(records: DailyRecord[], groupId: string, date: string, transform: (record: DailyRecord) => DailyRecord): Result<DailyRecord[]> {
  const record = records.find((candidate) => candidate.groupId === groupId && candidate.date === date)
  if (!record) return fail('未找到当日考勤记录')
  return succeed(replaceRecord(records, transform(record)))
}

export function ensureDailyRecord(input: { records: DailyRecord[]; groupId: string; date: string; people: AttendancePerson[]; plannedShift: (personId: string) => Shift }): { records: DailyRecord[]; record: DailyRecord } {
  const existing = input.records.find((record) => record.groupId === input.groupId && record.date === input.date)
  if (existing) return { records: input.records, record: existing }
  const record: DailyRecord = { groupId: input.groupId, date: input.date, status: 'draft', note: '', entries: input.people.filter((person) => person.groupId === input.groupId && person.activeFrom <= input.date).map((person) => ({ personId: person.id, planned: input.plannedShift(person.id), status: 'normal', note: '' })) }
  return { records: [...input.records, record], record }
}

export function updateEntryStatus(input: { records: DailyRecord[]; groupId: string; date: string; personId: string; status: ActualStatus }): Result<DailyRecord[]> {
  return updateRecord(input.records, input.groupId, input.date, (record) => ({ ...record, entries: record.entries.map((entry) => entry.personId !== input.personId ? entry : { ...entry, status: input.status, actualShift: input.status === 'swap' || input.status === 'top-up' ? entry.actualShift : undefined }) }))
}

export function updateEntryActualShift(input: { records: DailyRecord[]; groupId: string; date: string; personId: string; actualShift: Shift | undefined }): Result<DailyRecord[]> {
  return updateRecord(input.records, input.groupId, input.date, (record) => ({ ...record, entries: record.entries.map((entry) => entry.personId === input.personId ? { ...entry, actualShift: input.actualShift } : entry) }))
}

export function updateEntryNote(input: { records: DailyRecord[]; groupId: string; date: string; personId: string; note: string }): Result<DailyRecord[]> {
  return updateRecord(input.records, input.groupId, input.date, (record) => ({ ...record, entries: record.entries.map((entry) => entry.personId === input.personId ? { ...entry, note: input.note.trim() } : entry) }))
}

export function updateGroupNote(input: { records: DailyRecord[]; groupId: string; date: string; note: string }): Result<DailyRecord[]> {
  return updateRecord(input.records, input.groupId, input.date, (record) => ({ ...record, note: input.note }))
}

export function submitDailyRecord(input: { records: DailyRecord[]; groupId: string; date: string }): Result<DailyRecord[]> {
  return updateRecord(input.records, input.groupId, input.date, (record) => ({ ...record, status: 'submitted' }))
}

export function confirmDailyRecord(records: DailyRecord[], groupId: string, date: string): Result<DailyRecord[]> {
  return updateRecord(records, groupId, date, (record) => ({ ...record, status: 'confirmed' }))
}

export function addStatusOption(options: StatusOption[], label: string, value: string): Result<StatusOption[]> {
  const normalized = label.trim()
  if (!normalized) return fail('请填写状态名称')
  if (options.some((option) => option.label === normalized)) return fail('该考勤状态已存在')
  return succeed([...options, { value, label: normalized }])
}

export function removeStatusOption(input: { records: DailyRecord[]; options: StatusOption[]; value: string }): Result<{ records: DailyRecord[]; options: StatusOption[] }> {
  if (input.options.length === 1) return fail('至少保留一个考勤状态')
  const option = input.options.find((candidate) => candidate.value === input.value)
  if (!option) return fail('未找到考勤状态')
  const fallback = input.options.find((candidate) => candidate.value !== input.value)!.value
  return succeed({ options: input.options.filter((candidate) => candidate.value !== input.value), records: input.records.map((record) => ({ ...record, entries: record.entries.map((entry) => entry.status === input.value ? { ...entry, status: fallback, actualShift: undefined } : entry) })) })
}
