'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import { calcDeductions, calcNetPay } from '@/lib/salary-calculator'
import type { HrDailyWage, CreateDailyWageInput } from '@co-at/types'

const ADMIN = 'admin' as const

export async function getDailyWages(params?: {
  employeeId?: string
  from?: string
  to?: string
}): Promise<HrDailyWage[]> {
  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('hr_daily_wages')
    .select('*, hr_employees(name, department)')
    .order('work_date', { ascending: false })
  if (params?.employeeId) query = query.eq('employee_id', params.employeeId)
  if (params?.from) query = query.gte('work_date', params.from)
  if (params?.to)   query = query.lte('work_date', params.to)
  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function createDailyWage(input: CreateDailyWageInput): Promise<HrDailyWage | null> {
  await assertRole(ADMIN)
  const grossPay   = Math.round(input.hours_worked * input.hourly_rate)
  const deductions = calcDeductions(grossPay)
  const netPay     = calcNetPay(grossPay, deductions)

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_daily_wages')
    .insert({
      employee_id:  input.employee_id,
      work_date:    input.work_date,
      hours_worked: input.hours_worked,
      hourly_rate:  input.hourly_rate,
      gross_pay:    grossPay,
      deductions,
      net_pay:      netPay,
      note:         input.note ?? null,
    })
    .select()
    .single()
  if (error) {
    console.error('[createDailyWage]', error)
    return null
  }
  return data
}

export async function deleteDailyWage(id: string): Promise<boolean> {
  await assertRole(ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('hr_daily_wages').delete().eq('id', id)
  return !error
}
