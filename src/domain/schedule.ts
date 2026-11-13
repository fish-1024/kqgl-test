export type Shift = 'night' | 'day' | 'swing' | 'rest'

const fixedEightDayCycle: Shift[] = ['night', 'night', 'day', 'day', 'swing', 'swing', 'rest', 'rest']
const statutoryHolidays = new Set([
  '2026-01-01', '2026-01-02', '2026-01-03',
  '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22',
  '2026-04-04', '2026-04-05', '2026-04-06',
  '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
  '2026-06-19', '2026-06-20', '2026-06-21',
  '2026-09-25', '2026-09-26', '2026-09-27',
  '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07',
])

export interface PlannedGroup {
  id: string
  scheduleType: 'rotating' | 'weekday'
  referencePosition?: number
}

export function getBasePlannedShift(input: {
  group: PlannedGroup
  referenceDate: string
  date: string
}): Shift {
  if (input.group.scheduleType === 'weekday') {
    const dayOfWeek = new Date(`${input.date}T00:00:00`).getDay()
    return dayOfWeek === 0 || dayOfWeek === 6 || statutoryHolidays.has(input.date) ? 'rest' : 'day'
  }

  if (!input.group.referencePosition) throw new Error('Rotating group must have a cycle position')
  return getFixedFourTeamShiftFromReference(input.referenceDate, input.group.referencePosition, input.date)
}

export function getFixedFourTeamShiftFromReference(
  referenceDate: string,
  cyclePosition: number,
  date: string,
): Shift {
  if (!Number.isInteger(cyclePosition) || cyclePosition < 1 || cyclePosition > fixedEightDayCycle.length) {
    throw new Error('Cycle position must be between 1 and 8')
  }

  const reference = new Date(`${referenceDate}T00:00:00`)
  const current = new Date(`${date}T00:00:00`)
  const dayOffset = Math.round((current.getTime() - reference.getTime()) / 86_400_000)
  const cycleIndex = ((cyclePosition - 1 + dayOffset) % fixedEightDayCycle.length + fixedEightDayCycle.length) % fixedEightDayCycle.length
  return fixedEightDayCycle[cycleIndex]
}

export function getFixedFourTeamShift(firstNightDate: string, date: string): Shift {
  const start = new Date(`${firstNightDate}T00:00:00`)
  const current = new Date(`${date}T00:00:00`)
  const dayOffset = Math.round((current.getTime() - start.getTime()) / 86_400_000)
  const cycleIndex = ((dayOffset % fixedEightDayCycle.length) + fixedEightDayCycle.length) % fixedEightDayCycle.length
  return fixedEightDayCycle[cycleIndex]
}

export interface ScheduleRule {
  effectiveFrom: string
  cycle: Shift[]
}

interface Adjustment {
  date: string
  shift: Shift
  reason: string
}

interface PersonAdjustment extends Adjustment {
  personId: string
}

export interface PlannedShiftInput {
  date: string
  group: { id: string; cyclePosition: number }
  rules: ScheduleRule[]
  groupAdjustments: Adjustment[]
  personAdjustments: PersonAdjustment[]
  personId: string
}

export type PlanSource = 'base-plan' | 'group-adjustment' | 'person-adjustment'

export function getPlannedShift(input: PlannedShiftInput): { shift: Shift; source: PlanSource } {
  const personAdjustment = input.personAdjustments.find(
    (adjustment) => adjustment.date === input.date && adjustment.personId === input.personId,
  )
  if (personAdjustment) return { shift: personAdjustment.shift, source: 'person-adjustment' }

  const groupAdjustment = input.groupAdjustments.find((adjustment) => adjustment.date === input.date)
  if (groupAdjustment) return { shift: groupAdjustment.shift, source: 'group-adjustment' }

  const rule = [...input.rules]
    .filter((candidate) => candidate.effectiveFrom <= input.date)
    .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom))[0]

  if (!rule || rule.cycle.length !== 8) throw new Error('No valid eight-day schedule rule applies')

  const start = new Date(`${rule.effectiveFrom}T00:00:00`)
  const current = new Date(`${input.date}T00:00:00`)
  const days = Math.round((current.getTime() - start.getTime()) / 86_400_000)
  const index = (input.group.cyclePosition - 1 + days) % rule.cycle.length

  return { shift: rule.cycle[(index + rule.cycle.length) % rule.cycle.length], source: 'base-plan' }
}
