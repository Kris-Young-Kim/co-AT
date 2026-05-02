"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export interface CallLog {
  id: string
  log_date: string
  requester_type: string | null
  requester_region: string | null
  target_name: string | null
  target_gender: string | null
  target_disability_type: string | null
  target_disability_severity: string | null
  target_economic_status: string | null
  q_public_benefit: boolean
  q_private_benefit: boolean
  q_device: boolean
  q_case_management: boolean
  q_other: boolean
  question_content: string | null
  answer: string | null
  staff_name: string | null
  created_at: string | null
}

export type CreateCallLogInput = Omit<CallLog, 'id' | 'created_at'>

export async function getCallLogs(params?: {
  year?: number
  month?: number
  limit?: number
  offset?: number
}): Promise<{ success: boolean; logs?: CallLog[]; total?: number; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  let query = supabase.from('call_logs').select('*', { count: 'exact' })

  if (params?.year) {
    query = query
      .gte('log_date', `${params.year}-01-01`)
      .lte('log_date', `${params.year}-12-31`)
  }
  if (params?.month && params?.year) {
    const mm = String(params.month).padStart(2, '0')
    const lastDay = new Date(params.year, params.month, 0).getDate()
    query = query
      .gte('log_date', `${params.year}-${mm}-01`)
      .lte('log_date', `${params.year}-${mm}-${lastDay}`)
  }

  query = query.order('log_date', { ascending: false })

  const limit = params?.limit ?? 100
  const offset = params?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) return { success: false, error: error.message }
  return { success: true, logs: (data ?? []) as CallLog[], total: count ?? 0 }
}

export async function getCallLogById(id: string): Promise<{ success: boolean; log?: CallLog; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('call_logs').select('*').eq('id', id).single()
  if (error) return { success: false, error: error.message }
  return { success: true, log: data as CallLog }
}

export async function createCallLog(
  input: CreateCallLogInput
): Promise<{ success: boolean; log?: CallLog; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('call_logs')
    .insert(input)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/call-logs')
  return { success: true, log: data as CallLog }
}

export async function updateCallLog(
  id: string,
  input: Partial<CreateCallLogInput>
): Promise<{ success: boolean; log?: CallLog; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('call_logs')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/call-logs')
  return { success: true, log: data as CallLog }
}

export async function deleteCallLog(id: string): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('call_logs').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/call-logs')
  return { success: true }
}

/** 월별 콜센터 건수 집계 (stats용) */
export async function getCallLogMonthlyCount(year: number): Promise<{
  success: boolean
  monthly?: { month: number; count: number }[]
  total?: number
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('call_logs')
    .select('log_date')
    .gte('log_date', `${year}-01-01`)
    .lte('log_date', `${year}-12-31`)

  if (error) return { success: false, error: error.message }

  const counts = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }))
  for (const row of data ?? []) {
    const m = new Date(row.log_date).getMonth()
    counts[m].count++
  }
  const total = counts.reduce((s, c) => s + c.count, 0)
  return { success: true, monthly: counts, total }
}
