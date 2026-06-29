"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { withStaffPermission } from "@/lib/utils/with-permission"
import { revalidatePath } from "next/cache"
import { updateTranscript } from "./transcript-actions"

export interface CallLog {
  id: string
  log_date: string
  requester_name: string | null
  requester_contact: string | null
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
  return withStaffPermission(async () => {

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
  })
}

export async function getCallLogById(id: string): Promise<{ success: boolean; log?: CallLog; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()
    const { data, error } = await supabase.from('call_logs').select('*').eq('id', id).single()
    if (error) return { success: false, error: error.message }
    return { success: true, log: data as CallLog }
  })
}

export async function createCallLog(
  input: CreateCallLogInput,
  transcriptId?: string | null
): Promise<{ success: boolean; log?: CallLog; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('call_logs')
      .insert(input)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    const log = data as CallLog & { application_id?: string | null }

    // Auto-generate service record draft when device-related + application linked
    let serviceRecordId: string | null = null
    if (log.q_device && (log as any).application_id) {
      try {
        const appId = (log as any).application_id as string
        const { data: appRow } = await (supabase as any)
          .from('applications')
          .select('client_id, category, sub_category')
          .eq('id', appId)
          .single()

        if (appRow) {
          const CATEGORY_MAP: Record<string, string> = {
            consult: '상담', experience: '체험·시연', custom: '맞춤형 지원',
            aftercare: '사후관리', education: '교육·홍보',
          }
          const catLabel = CATEGORY_MAP[appRow.category ?? ''] ?? appRow.category ?? '기타'
          const { data: srData } = await (supabase as any)
            .from('eval_service_records')
            .insert({
              client_id: appRow.client_id,
              received_at: log.log_date,
              service_major_category: '서비스지원',
              service_category: catLabel,
              is_consult: appRow.category === 'consult',
              is_rental: appRow.sub_category === 'rental',
              is_custom_make: appRow.sub_category === 'custom_make',
              is_repair: appRow.sub_category === 'repair',
              record_status: '미정',
              referral_type: (log as any).channel === 'web' ? '인터넷신청' : (log as any).channel === 'chatbot' ? '인터넷신청' : '유선',
              service_content: log.question_content ?? null,
            })
            .select('id')
            .single()
          serviceRecordId = srData?.id ?? null
        }
      } catch (err) {
        console.error('[createCallLog] service record draft 자동생성 실패:', err)
        // non-fatal
      }
    }

    // Link transcript to this call log (and service record if created)
    if (transcriptId) {
      try {
        await updateTranscript(transcriptId, {
          linked_call_log_id: log.id,
          ...(serviceRecordId ? { linked_service_record_id: serviceRecordId } : {}),
        })
      } catch (err) {
        console.error('[createCallLog] transcript 링크 업데이트 실패:', err)
        // non-fatal
      }
    }

    revalidatePath('/call-logs')
    return { success: true, log: data as CallLog }
  })
}

export async function updateCallLog(
  id: string,
  input: Partial<CreateCallLogInput>
): Promise<{ success: boolean; log?: CallLog; error?: string }> {
  return withStaffPermission(async () => {

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
  })
}

export async function deleteCallLog(id: string): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()
    const { error } = await supabase.from('call_logs').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/call-logs')
    return { success: true }
  })
}

/** 월별 콜센터 건수 집계 (stats용) */
export async function getCallLogMonthlyCount(year: number): Promise<{
  success: boolean
  monthly?: { month: number; count: number }[]
  total?: number
  error?: string
}> {
  return withStaffPermission(async () => {

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
  })
}
