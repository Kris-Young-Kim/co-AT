'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type { HrSeveranceRecord, CreateSeveranceInput } from '@co-at/types'

type SeveranceWithEmployee = HrSeveranceRecord & {
  hr_employees: { name: string; department: string; hire_date: string } | null
}

/** 퇴직금 계산: 1일 평균임금 × 30 × (계속근로연수) */
function calcSeverance(avgDailyWage: number, serviceYears: number): number {
  return Math.floor(avgDailyWage * 30 * serviceYears)
}

/** 퇴직소득세 간이 계산 (단순화: 퇴직금의 5.5%) */
function calcSeveranceTax(severancePay: number): number {
  return Math.floor(severancePay * 0.055)
}

/** 전체 퇴직정산 목록 */
export async function getSeveranceRecords(): Promise<SeveranceWithEmployee[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_severance_records')
    .select('*, hr_employees(name, department, hire_date)')
    .order('leave_date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as SeveranceWithEmployee[]
}

/** 퇴직금 계산 (미리보기용 — DB 저장 없음) */
export async function previewSeverance(
  employeeId: string,
  leaveDate: string
): Promise<{ service_years: number; avg_daily_wage: number; severance_pay: number; tax: number; net: number } | null> {
  const supabase = createSupabaseAdmin()

  const { data: emp } = await supabase
    .from('hr_employees')
    .select('hire_date')
    .eq('id', employeeId)
    .single()
  if (!emp) return null

  const hire = new Date(emp.hire_date as string)
  const leave = new Date(leaveDate)
  const serviceYears = (leave.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  if (serviceYears < 1) return null

  // 최근 3개월 급여 평균
  const threeMonthsAgo = new Date(leave)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const fromYM = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`
  const toYM = `${leave.getFullYear()}-${String(leave.getMonth() + 1).padStart(2, '0')}`

  const { data: salaries } = await supabase
    .from('hr_salary_records')
    .select('gross_pay, year_month')
    .eq('employee_id', employeeId)
    .gte('year_month', fromYM)
    .lte('year_month', toYM)

  const totalPay = (salaries ?? []).reduce((s, r) => s + (r.gross_pay as number), 0)
  const monthCount = (salaries ?? []).length || 3
  const avgDailyWage = Math.floor(totalPay / (monthCount * 30))

  const severancePay = calcSeverance(avgDailyWage, serviceYears)
  const tax = calcSeveranceTax(severancePay)

  return {
    service_years: Math.round(serviceYears * 100) / 100,
    avg_daily_wage: avgDailyWage,
    severance_pay: severancePay,
    tax,
    net: severancePay - tax,
  }
}

/** 퇴직금 정산 저장 */
export async function createSeveranceRecord(input: CreateSeveranceInput): Promise<void> {
  const supabase = createSupabaseAdmin()

  const preview = await previewSeverance(input.employee_id, input.leave_date)
  if (!preview) throw new Error('계속근로기간이 1년 미만이거나 급여 데이터가 없습니다.')

  const avgWage = input.avg_daily_wage > 0 ? input.avg_daily_wage : preview.avg_daily_wage
  const severancePay = calcSeverance(avgWage, preview.service_years)
  const tax = calcSeveranceTax(severancePay)

  const { error } = await supabase.from('hr_severance_records').insert({
    employee_id: input.employee_id,
    leave_date: input.leave_date,
    service_years: preview.service_years,
    avg_daily_wage: avgWage,
    severance_pay: severancePay,
    tax_deducted: tax,
    net_severance: severancePay - tax,
    note: input.note ?? null,
  })
  if (error) throw new Error(error.message)
}
