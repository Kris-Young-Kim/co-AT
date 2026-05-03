'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import type { HrLeaveRequest, CreateLeaveRequestInput, ReviewLeaveInput } from '@co-at/types'

const MANAGER = 'manager' as const

export async function getLeaveRequests(params?: {
  employeeId?: string
  status?: string
  year?: number
}): Promise<HrLeaveRequest[]> {
  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('hr_leave_requests')
    .select('*, hr_employees(name, department)')
    .order('created_at', { ascending: false })

  if (params?.employeeId) query = query.eq('employee_id', params.employeeId)
  if (params?.status)     query = query.eq('status', params.status)
  if (params?.year) {
    query = query
      .gte('start_date', `${params.year}-01-01`)
      .lte('start_date', `${params.year}-12-31`)
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function createLeaveRequest(input: CreateLeaveRequestInput): Promise<HrLeaveRequest | null> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_leave_requests')
    .insert({
      employee_id: input.employee_id,
      leave_type:  input.leave_type,
      start_date:  input.start_date,
      end_date:    input.end_date,
      days_used:   input.days_used,
      reason:      input.reason ?? null,
    })
    .select()
    .single()
  if (error) {
    console.error('[createLeaveRequest]', error)
    return null
  }
  return data
}

export async function reviewLeaveRequest(input: ReviewLeaveInput): Promise<boolean> {
  await assertRole(MANAGER)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('hr_leave_requests')
    .update({
      status:      input.status,
      reviewed_by: input.reviewed_by,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', input.id)
  return !error
}

export async function getApprovedLeaveDaysInYear(
  employeeId: string,
  year: number
): Promise<number> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('hr_leave_requests')
    .select('days_used')
    .eq('employee_id', employeeId)
    .eq('status', 'approved')
    .gte('start_date', `${year}-01-01`)
    .lte('start_date', `${year}-12-31`)
  if (error) return 0
  return (data ?? []).reduce((sum: number, r: { days_used: number | null }) => sum + Number(r.days_used), 0)
}
