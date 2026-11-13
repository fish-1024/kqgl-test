export type AccessContext = { type: 'admin' } | { type: 'group-link'; groupId: string }

export function canViewGroup(context: AccessContext, groupId: string): boolean {
  return context.type === 'admin' || context.groupId === groupId
}

export function canEditRecord(
  context: AccessContext,
  groupId: string,
  recordDate: string,
  today: string,
): boolean {
  if (!canViewGroup(context, groupId)) return false
  return context.type === 'admin' || recordDate === today
}
