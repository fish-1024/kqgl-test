export type AttendanceStatus = 'draft' | 'submitted' | 'confirmed' | 'locked'

export interface DailyAttendanceState {
  date: string
  status: AttendanceStatus
  hasUnresolvedException: boolean
  hasPaperDifference?: boolean
}

export function lockMonth(records: DailyAttendanceState[]): DailyAttendanceState[] {
  if (records.some((record) => record.status === 'draft')) throw new Error('存在未提交记录')
  if (records.some((record) => record.status !== 'confirmed')) throw new Error('存在未确认记录')
  if (records.some((record) => record.hasUnresolvedException)) throw new Error('存在未确认异常')
  if (records.some((record) => record.hasPaperDifference)) throw new Error('存在未处理纸电差异')

  return records.map((record) => ({ ...record, status: 'locked' }))
}
