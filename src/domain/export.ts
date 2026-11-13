import type { Shift } from './schedule'

interface ExportCellInput {
  plannedShift: Shift
  actualStatus: string
  actualShift?: Shift
}

const shiftCodes: Record<Shift, string> = {
  night: '夜',
  day: '√',
  swing: '中',
  rest: '休',
}

const statusCodes: Record<string, string> = {
  'personal-leave': '事',
  'sick-leave': '病',
  'annual-leave': '年',
  absent: '旷',
}

export function buildExportCell(input: ExportCellInput): string {
  if ((input.actualStatus === 'swap' || input.actualStatus === 'top-up') && input.actualShift) {
    return shiftCodes[input.actualShift]
  }

  return statusCodes[input.actualStatus] ?? shiftCodes[input.plannedShift]
}

export function createExportVersion(month: string, sequence: number): string {
  return `${month}-V${String(sequence).padStart(3, '0')}`
}
