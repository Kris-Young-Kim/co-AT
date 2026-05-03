import { describe, it, expect } from 'vitest'
import { calcAnnualLeaveDays, calcLeaveBalance } from '@/apps/hr/lib/leave-calculator'

describe('calcAnnualLeaveDays', () => {
  it('returns 15 for less than 3 years', () => {
    expect(calcAnnualLeaveDays(0)).toBe(15)
    expect(calcAnnualLeaveDays(1)).toBe(15)
    expect(calcAnnualLeaveDays(2)).toBe(15)
  })

  it('returns 16 at exactly 3 years', () => {
    expect(calcAnnualLeaveDays(3)).toBe(16)
  })

  it('increments by 1 per year from 3 years', () => {
    expect(calcAnnualLeaveDays(5)).toBe(18)
    expect(calcAnnualLeaveDays(10)).toBe(23)
  })

  it('caps at 25 days', () => {
    expect(calcAnnualLeaveDays(20)).toBe(25)
    expect(calcAnnualLeaveDays(100)).toBe(25)
  })
})

describe('calcLeaveBalance', () => {
  it('returns full entitlement when no leaves used', () => {
    const result = calcLeaveBalance({ hireDate: '2020-01-01', year: 2026, usedDays: 0 })
    expect(result.entitlement).toBe(19) // 6 years: 15 + (6-2) = 19
    expect(result.used).toBe(0)
    expect(result.remaining).toBe(19)
  })

  it('subtracts used days', () => {
    const result = calcLeaveBalance({ hireDate: '2020-01-01', year: 2026, usedDays: 5 })
    expect(result.remaining).toBe(14)
  })
})
