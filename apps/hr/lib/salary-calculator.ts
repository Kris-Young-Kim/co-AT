import type { SalaryDeductions, SalaryAllowance } from '@co-at/types'

const RATES = {
  national_pension:     0.045,    // 국민연금 4.5%
  health_insurance:     0.03545,  // 건강보험 3.545%
  long_term_care:       0.004545, // 장기요양보험 건강보험료×12.81% ≈ 기본급×0.4545%
  employment_insurance: 0.009,    // 고용보험 0.9%
  income_tax:           0.033,    // 근로소득세 3.3% (간이세액표 단순화)
} as const

export function calcDeductions(baseSalary: number): SalaryDeductions {
  const income_tax = Math.round(baseSalary * RATES.income_tax)
  return {
    national_pension:     Math.round(baseSalary * RATES.national_pension),
    health_insurance:     Math.round(baseSalary * RATES.health_insurance),
    long_term_care:       Math.round(baseSalary * RATES.long_term_care),
    employment_insurance: Math.round(baseSalary * RATES.employment_insurance),
    income_tax,
    local_income_tax:     Math.round(income_tax * 0.1),
  }
}

export function calcGrossPay(baseSalary: number, allowances: SalaryAllowance[]): number {
  return baseSalary + allowances.reduce((sum, a) => sum + a.amount, 0)
}

export function calcNetPay(grossPay: number, deductions: SalaryDeductions): number {
  return grossPay - (
    deductions.national_pension +
    deductions.health_insurance +
    deductions.long_term_care +
    deductions.employment_insurance +
    deductions.income_tax +
    deductions.local_income_tax
  )
}

export function totalDeductions(deductions: SalaryDeductions): number {
  return (
    deductions.national_pension +
    deductions.health_insurance +
    deductions.long_term_care +
    deductions.employment_insurance +
    deductions.income_tax +
    deductions.local_income_tax
  )
}
