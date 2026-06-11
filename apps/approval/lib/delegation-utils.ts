interface DelegationDateRange {
  is_active: boolean
  start_date: string | null
  end_date: string | null
}

export function isActiveDelegation(delegation: DelegationDateRange, today: string): boolean {
  if (!delegation.is_active) return false
  if (delegation.start_date !== null && delegation.start_date > today) return false
  if (delegation.end_date !== null && delegation.end_date < today) return false
  return true
}
