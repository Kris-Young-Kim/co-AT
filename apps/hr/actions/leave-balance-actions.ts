'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type { HrLeaveBalance, UpsertLeaveBalanceInput } from '@co-at/types'

/** 연차 자동 계산: 근로기준법 기준 */
function calcEntitlement(hireDateStr: string, year: number): number {
  const hire = new Date(hireDateStr)
  const jan1 = new Date(year, 0, 1)
  const yearStart = hire > jan1 ? hire : jan1
  const yearEnd = new Date(year, 11, 31)

  const yearsOfService =
    (yearEnd.getFullYear() - hire.getFullYear()) +
    (yearEnd.getMonth() - hire.getMonth()) / 12

  if (yearsOfService < 1) {
    const months =
      (yearEnd.getFullYear() - yearStart.getFullYear()) * 12 +
      (yearEnd.getMonth() - yearStart.getMonth()) + 1
    return Math.min(Math.floor(months), 11)
  }
  const extra = Math.floor((yearsOfService - 1) / 2)
  return Math.min(15 + extra, 25)
}

/**
 * 중도 입사자 여부 판단:
 * year-1 연도에 입사했으며 해당 연도 1월 1일이 아닌 경우 → year에 특별휴가 5일 부여
 */
function isMidYearHire(hireDateStr: string, year: number): boolean {
  const hire = new Date(hireDateStr)
  const prevYearJan1 = new Date(year - 1, 0, 1)
  const prevYearDec31 = new Date(year - 1, 11, 31)
  return hire > prevYearJan1 && hire <= prevYearDec31
}

export type LeaveBalanceWithEmployee = HrLeaveBalance & {
  hr_employees: { name: string; department: string } | null
}

export type AggregatedLeaveBalance = {
  employee_id: string
  name: string
  department: string
  annual_entitlement: number
  annual_carry_over: number
  annual_used: number
  special_entitlement: number
  special_used: number
  annual_remaining: number
  special_remaining: number
}

/** 특정 연도 전직원 연차+특별휴가 잔여 집계 조회 */
export async function getLeaveBalancesByYear(year: number): Promise<AggregatedLeaveBalance[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_leave_balances')
    .select('*, hr_employees(name, department)')
    .eq('year', year)
    .in('leave_type', ['annual', 'special'])
    .order('employee_id')
  if (error) throw new Error(error.message)

  type Row = LeaveBalanceWithEmployee
  const rows = (data ?? []) as unknown as Row[]

  const map = new Map<string, AggregatedLeaveBalance>()
  for (const r of rows) {
    const key = r.employee_id
    const entry = map.get(key) ?? {
      employee_id: key,
      name: r.hr_employees?.name ?? '—',
      department: r.hr_employees?.department ?? '—',
      annual_entitlement: 0,
      annual_carry_over: 0,
      annual_used: 0,
      special_entitlement: 0,
      special_used: 0,
      annual_remaining: 0,
      special_remaining: 0,
    }
    if (r.leave_type === 'annual') {
      entry.annual_entitlement = r.entitlement
      entry.annual_carry_over = r.carry_over
      entry.annual_used = r.used
    } else if (r.leave_type === 'special') {
      entry.special_entitlement = r.entitlement
      entry.special_used = r.used
    }
    map.set(key, entry)
  }

  return [...map.values()].map(e => ({
    ...e,
    annual_remaining: e.annual_entitlement + e.annual_carry_over - e.annual_used,
    special_remaining: e.special_entitlement - e.special_used,
  })).sort((a, b) => a.name.localeCompare(b.name))
}

/** 특정 직원의 연차잔여 목록 */
export async function getLeaveBalancesByEmployee(
  employeeId: string
): Promise<HrLeaveBalance[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_leave_balances')
    .select('*')
    .eq('employee_id', employeeId)
    .order('year', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as HrLeaveBalance[]
}

/** upsert 연차 잔여 (단일) */
export async function upsertLeaveBalance(input: UpsertLeaveBalanceInput): Promise<void> {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('hr_leave_balances')
    .upsert(
      {
        employee_id: input.employee_id,
        year: input.year,
        leave_type: input.leave_type,
        entitlement: input.entitlement ?? 0,
        used: input.used ?? 0,
        carry_over: input.carry_over ?? 0,
      },
      { onConflict: 'employee_id,year,leave_type' }
    )
  if (error) throw new Error(error.message)
}

/** 연도별 전직원 연차 자동 생성 (중도 입사자 특별휴가 5일 포함) */
export async function generateLeaveBalancesForYear(year: number): Promise<{ created: number }> {
  const supabase = createSupabaseAdmin()

  const { data: employees, error: empErr } = await supabase
    .from('hr_employees')
    .select('id, hire_date')
    .eq('is_active', true)
  if (empErr) throw new Error(empErr.message)

  const annualRows: object[] = []
  const specialRows: object[] = []

  for (const emp of (employees ?? []) as { id: string; hire_date: string }[]) {
    annualRows.push({
      employee_id: emp.id,
      year,
      leave_type: 'annual',
      entitlement: calcEntitlement(emp.hire_date, year),
      used: 0,
      carry_over: 0,
    })

    // 중도 입사자: 이전 연도 1월 2일 이후 입사 → 해당 연도 특별휴가 5일
    if (isMidYearHire(emp.hire_date, year)) {
      specialRows.push({
        employee_id: emp.id,
        year,
        leave_type: 'special',
        entitlement: 5,
        used: 0,
        carry_over: 0,
      })
    }
  }

  if (annualRows.length === 0) return { created: 0 }

  const { error: annualErr } = await supabase
    .from('hr_leave_balances')
    .upsert(annualRows, { onConflict: 'employee_id,year,leave_type', ignoreDuplicates: true })
  if (annualErr) throw new Error(annualErr.message)

  if (specialRows.length > 0) {
    const { error: specialErr } = await supabase
      .from('hr_leave_balances')
      .upsert(specialRows, { onConflict: 'employee_id,year,leave_type', ignoreDuplicates: true })
    if (specialErr) throw new Error(specialErr.message)
  }

  return { created: annualRows.length }
}

/**
 * 연차 사용일수 업데이트 (휴가 승인 시 호출)
 * 우선순위: 특별휴가 먼저 소진 → 잔여분은 연차에서 차감
 */
export async function incrementLeaveUsed(
  employeeId: string,
  year: number,
  daysUsed: number
): Promise<void> {
  const supabase = createSupabaseAdmin()

  // 특별휴가 잔여 확인
  const { data: special } = await supabase
    .from('hr_leave_balances')
    .select('id, used, entitlement')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .eq('leave_type', 'special')
    .single()

  let remainingDays = daysUsed

  if (special) {
    const specialRemaining = (special.entitlement as number) - (special.used as number)
    if (specialRemaining > 0) {
      const specialDeduct = Math.min(remainingDays, specialRemaining)
      const { error } = await supabase
        .from('hr_leave_balances')
        .update({ used: (special.used as number) + specialDeduct })
        .eq('id', special.id)
      if (error) throw new Error(error.message)
      remainingDays -= specialDeduct
    }
  }

  // 잔여일수를 연차에서 차감
  if (remainingDays > 0) {
    const { data: annual } = await supabase
      .from('hr_leave_balances')
      .select('id, used')
      .eq('employee_id', employeeId)
      .eq('year', year)
      .eq('leave_type', 'annual')
      .single()

    if (annual) {
      const { error } = await supabase
        .from('hr_leave_balances')
        .update({ used: (annual.used as number) + remainingDays })
        .eq('id', annual.id)
      if (error) throw new Error(error.message)
    }
  }
}
