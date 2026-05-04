'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import { calcDeductions, calcGrossPay, calcNetPay } from '@/lib/salary-calculator'
import type {
  HrSalaryRecord,
  CreateSalaryRecordInput,
  UpdateSalaryRecordInput,
} from '@co-at/types'

const ADMIN = 'admin' as const

export async function getSalaryRecordsByMonth(yearMonth: string): Promise<HrSalaryRecord[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_salary_records')
    .select('*, hr_employees(name, department)')
    .eq('year_month', yearMonth)
    .order('created_at')
  if (error) {
    console.error('[getSalaryRecordsByMonth]', error)
    return []
  }
  return data ?? []
}

export async function getSalaryRecordsByEmployee(employeeId: string): Promise<HrSalaryRecord[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_salary_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('year_month', { ascending: false })
  if (error) return []
  return data ?? []
}

export async function createSalaryRecord(input: CreateSalaryRecordInput): Promise<HrSalaryRecord | null> {
  await assertRole(ADMIN)
  const grossPay = calcGrossPay(input.base_salary, input.allowances)
  const deductions = calcDeductions(input.base_salary)
  const netPay = calcNetPay(grossPay, deductions)

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_salary_records')
    .insert({
      employee_id:     input.employee_id,
      year_month:      input.year_month,
      salary_grade_id: input.salary_grade_id ?? null,
      base_salary:     input.base_salary,
      allowances:      input.allowances,
      deductions,
      gross_pay:       grossPay,
      net_pay:         netPay,
      note:            input.note ?? null,
    })
    .select()
    .single()
  if (error) {
    console.error('[createSalaryRecord]', error)
    return null
  }
  return data
}

export async function updateSalaryRecord(id: string, input: UpdateSalaryRecordInput): Promise<HrSalaryRecord | null> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { data: current } = await supabase
    .from('hr_salary_records')
    .select('base_salary, allowances, confirmed_at')
    .eq('id', id)
    .single()

  if (current?.confirmed_at) {
    console.error('[updateSalaryRecord] Cannot update confirmed record')
    return null
  }

  const baseSalary = input.base_salary  ?? current?.base_salary  ?? 0
  const allowances = input.allowances   ?? current?.allowances   ?? []
  const grossPay   = calcGrossPay(baseSalary, allowances)
  const deductions = calcDeductions(baseSalary)
  const netPay     = calcNetPay(grossPay, deductions)

  const { data, error } = await supabase
    .from('hr_salary_records')
    .update({
      ...input,
      deductions,
      gross_pay:  grossPay,
      net_pay:    netPay,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) {
    console.error('[updateSalaryRecord]', error)
    return null
  }
  return data
}

export async function confirmSalaryRecord(id: string): Promise<boolean> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('hr_salary_records')
    .update({ confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

export async function deleteSalaryRecord(id: string): Promise<boolean> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('hr_salary_records')
    .select('confirmed_at')
    .eq('id', id)
    .single()
  if (data?.confirmed_at) return false
  const { error } = await supabase.from('hr_salary_records').delete().eq('id', id)
  return !error
}

export async function getDistinctSalaryMonths(): Promise<string[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_salary_records')
    .select('year_month')
    .order('year_month', { ascending: false })
  if (error) return []
  const months = [...new Set((data ?? []).map((r: { year_month: string }) => r.year_month))]
  return months
}
