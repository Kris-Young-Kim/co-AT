'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import { calcYearEndTax, type YearEndTaxInput } from '@/lib/year-end-tax-calculator'
import { getSalaryRecordsByMonth } from '@/actions/salary-actions'

const ADMIN = 'admin' as const
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))

export interface YearEndTaxRecord {
  id: string
  employee_id: string
  tax_year: number
  gross_income: number
  dependents_count: number
  elderly_count: number
  disabled_count: number
  medical_expenses: number
  education_expenses: number
  housing_rent: number
  prepaid_income_tax: number
  prepaid_local_tax: number
  earned_income_deduction: number
  personal_deduction: number
  special_tax_credit: number
  calculated_income_tax: number
  earned_income_tax_credit: number
  final_income_tax: number
  final_local_tax: number
  refund_income_tax: number
  refund_local_tax: number
  note: string | null
}

export type UpsertYearEndTaxInput = Omit<
  YearEndTaxInput,
  'prepaidIncomeTax' | 'prepaidLocalTax'
> & {
  employeeId: string
  taxYear: number
  note?: string | null
}

/** 해당 연도 급여대장에서 직원별 원천징수 세액을 집계합니다 */
async function aggregatePrepaidTax(taxYear: number): Promise<Map<string, { income: number; incomeTax: number; localTax: number }>> {
  const result = new Map<string, { income: number; incomeTax: number; localTax: number }>()

  const monthlyData = await Promise.all(
    MONTHS.map(m => getSalaryRecordsByMonth(`${taxYear}-${m}`))
  )

  for (const records of monthlyData) {
    for (const r of records as unknown as Array<{
      employee_id: string
      gross_pay: number
      deductions: { income_tax: number; local_income_tax: number }
    }>) {
      const existing = result.get(r.employee_id) ?? { income: 0, incomeTax: 0, localTax: 0 }
      existing.income += r.gross_pay
      existing.incomeTax += r.deductions.income_tax
      existing.localTax += r.deductions.local_income_tax
      result.set(r.employee_id, existing)
    }
  }

  return result
}

export async function listYearEndTaxByYear(taxYear: number): Promise<{
  records: (YearEndTaxRecord & { hr_employees: { name: string; department: string } | null })[]
  grossByEmp: Map<string, { income: number; incomeTax: number; localTax: number }>
}> {
  const supabase = createSupabaseAdmin()
  const [{ data }, grossByEmp] = await Promise.all([
    supabase
      .from('hr_year_end_tax')
      .select('*, hr_employees(name, department)')
      .eq('tax_year', taxYear)
      .order('created_at'),
    aggregatePrepaidTax(taxYear),
  ])

  return { records: (data ?? []) as never, grossByEmp }
}

export async function getYearEndTax(employeeId: string, taxYear: number): Promise<YearEndTaxRecord | null> {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('hr_year_end_tax')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('tax_year', taxYear)
    .maybeSingle()
  return (data ?? null) as YearEndTaxRecord | null
}

export async function upsertYearEndTax(
  input: UpsertYearEndTaxInput
): Promise<{ success: boolean; error?: string }> {
  await assertRole(ADMIN)

  const prepaid = await aggregatePrepaidTax(input.taxYear)
  const empPrepaid = prepaid.get(input.employeeId) ?? { income: 0, incomeTax: 0, localTax: 0 }

  const grossIncome = empPrepaid.income || input.grossIncome
  const calcInput: YearEndTaxInput = {
    grossIncome,
    dependentsCount: input.dependentsCount,
    elderlyCount: input.elderlyCount,
    disabledCount: input.disabledCount,
    medicalExpenses: input.medicalExpenses,
    educationExpenses: input.educationExpenses,
    housingRent: input.housingRent,
    prepaidIncomeTax: empPrepaid.incomeTax,
    prepaidLocalTax: empPrepaid.localTax,
  }

  const calc = calcYearEndTax(calcInput)

  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('hr_year_end_tax').upsert({
    employee_id:               input.employeeId,
    tax_year:                  input.taxYear,
    gross_income:              grossIncome,
    dependents_count:          input.dependentsCount,
    elderly_count:             input.elderlyCount,
    disabled_count:            input.disabledCount,
    medical_expenses:          input.medicalExpenses,
    education_expenses:        input.educationExpenses,
    housing_rent:              input.housingRent,
    prepaid_income_tax:        empPrepaid.incomeTax,
    prepaid_local_tax:         empPrepaid.localTax,
    earned_income_deduction:   calc.earnedIncomeDeduction,
    personal_deduction:        calc.personalDeduction,
    special_tax_credit:        calc.specialTaxCredit,
    calculated_income_tax:     calc.calculatedIncomeTax,
    earned_income_tax_credit:  calc.earnedIncomeTaxCredit,
    final_income_tax:          calc.finalIncomeTax,
    final_local_tax:           calc.finalLocalTax,
    refund_income_tax:         calc.refundIncomeTax,
    refund_local_tax:          calc.refundLocalTax,
    note:                      input.note ?? null,
    updated_at:                new Date().toISOString(),
  }, { onConflict: 'employee_id,tax_year' })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getActiveEmployees(): Promise<Array<{ id: string; name: string; department: string }>> {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('hr_employees')
    .select('id, name, department')
    .eq('is_active', true)
    .order('name')
  return (data ?? []) as Array<{ id: string; name: string; department: string }>
}
