'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'

export interface CreateLogInput {
  jobName: string
  triggeredBy: 'cron' | 'manual'
  status: 'success' | 'partial' | 'failed'
  totalSent: number
  successCount: number
  failCount: number
  channel: 'in-app' | 'email' | 'kakao'
  errorMessage?: string
  metadata?: Record<string, unknown>
}

export async function createLog(input: CreateLogInput) {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('automation_logs').insert({
    job_name:      input.jobName,
    triggered_by:  input.triggeredBy,
    status:        input.status,
    total_sent:    input.totalSent,
    success_count: input.successCount,
    fail_count:    input.failCount,
    channel:       input.channel,
    error_message: input.errorMessage,
    metadata:      input.metadata,
  })
  if (error) console.error('[createLog] error:', error)
}

export async function getLogs(params?: {
  jobName?: string
  status?: string
  fromDate?: string
  toDate?: string
  limit?: number
}) {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('automation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(params?.limit ?? 100)

  if (params?.jobName) query = query.eq('job_name', params.jobName)
  if (params?.status)  query = query.eq('status', params.status)
  if (params?.fromDate) query = query.gte('created_at', params.fromDate)
  if (params?.toDate)   query = query.lte('created_at', params.toDate)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function getTodaySummary() {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('automation_logs')
    .select('*')
    .gte('created_at', `${today}T00:00:00Z`)
  if (error) throw new Error(error.message)
  return data
}
