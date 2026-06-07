"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { maskPii } from "@/lib/utils/pii-mask"
import { revalidatePath } from "next/cache"

export interface TranscriptInput {
  client_id?: string | null
  staff_id: string
  session_type: 'call' | 'video' | 'visit' | 'meeting'
  session_date: string
  duration_sec?: number | null
  raw_transcript?: string | null
  transcript: string
  ai_summary?: string | null
  key_points?: {
    chief_complaint?: string
    requested_device?: string
    agreed_action?: string
    next_step?: string
  } | null
  consent_given?: boolean
  linked_call_log_id?: string | null
  linked_service_record_id?: string | null
}

export interface SessionTranscript extends TranscriptInput {
  id: string
  created_at: string
  updated_at?: string
}

export async function saveTranscript(
  input: TranscriptInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const maskedTranscript = maskPii(input.transcript)
  const payload = {
    ...input,
    transcript: maskedTranscript,
    raw_transcript: input.raw_transcript ?? null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from('eval_session_transcripts')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/call-logs')
  return { success: true, id: (data as { id: string }).id }
}

export async function updateTranscript(
  id: string,
  updates: Partial<Pick<TranscriptInput, 'ai_summary' | 'key_points' | 'linked_call_log_id' | 'linked_service_record_id'>>
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase
    .from('eval_session_transcripts')
    .update(updates)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getTranscriptsByClient(
  clientId: string
): Promise<{ success: boolean; transcripts?: SessionTranscript[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from('eval_session_transcripts')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { success: false, error: error.message }
  return { success: true, transcripts: (data ?? []) as SessionTranscript[] }
}

export async function getRecentTranscripts(
  limit = 20
): Promise<{ success: boolean; transcripts?: SessionTranscript[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from('eval_session_transcripts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { success: false, error: error.message }
  return { success: true, transcripts: (data ?? []) as SessionTranscript[] }
}
