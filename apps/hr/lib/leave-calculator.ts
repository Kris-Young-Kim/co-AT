/** Returns annual leave entitlement days based on years of service */
export function calcAnnualLeaveDays(yearsOfService: number): number {
  if (yearsOfService < 3) return 15
  return Math.min(15 + (yearsOfService - 2), 25)
}

interface LeaveBalanceParams {
  hireDate: string   // ISO date string 'YYYY-MM-DD'
  year: number       // calendar year to calculate for
  usedDays: number   // approved leave days used in this year
}

export function calcLeaveBalance(params: LeaveBalanceParams): {
  entitlement: number
  used: number
  remaining: number
} {
  const hire = new Date(params.hireDate)
  const yearsOfService = params.year - hire.getFullYear()
  const entitlement = calcAnnualLeaveDays(Math.max(0, yearsOfService))
  return {
    entitlement,
    used: params.usedDays,
    remaining: entitlement - params.usedDays,
  }
}
