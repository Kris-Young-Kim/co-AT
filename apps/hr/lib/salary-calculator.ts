import type { SalaryDeductions, SalaryAllowance } from '@co-at/types'

const RATES = {
  national_pension:     0.045,
  health_insurance:     0.03545,
  employment_insurance: 0.009,
  income_tax:           0.033,
} as const

/** Calculates all statutory deductions from base salary */
export function calcDeductions(baseSalary: number): SalaryDeductions {
  const income_tax = Math.round(baseSalary * RATES.income_tax)
  return {
    national_pension:     Math.round(baseSalary * RATES.national_pension),
    health_insurance:     Math.round(baseSalary * RATES.health_insurance),
    employment_insurance: Math.round(baseSalary * RATES.employment_insurance),
    income_tax,
    local_income_tax:     Math.round(income_tax * 0.1),
  }
}

/** Calculates gross pay = base salary + sum of allowances */
export function calcGrossPay(baseSalary: number, allowances: SalaryAllowance[]): number {
  return baseSalary + allowances.reduce((sum, a) => sum + a.amount, 0)
}

/** Calculates net pay = gross pay - total deductions */
export function calcNetPay(grossPay: number, deductions: SalaryDeductions): number {
  const total =
    deductions.national_pension +
    deductions.health_insurance +
    deductions.employment_insurance +
    deductions.income_tax +
    deductions.local_income_tax
  return grossPay - total
}
