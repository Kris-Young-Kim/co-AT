"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface ConsultationRecord {
  id: string
  client_id: string
  application_id: string | null
  consultation_date: string
  consultation_type: string
  consultant: string | null
  purpose: string | null
  current_situation: string | null
  content: string | null
  result: string | null
  next_plan: string | null
  ai_generated: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AssessmentNote {
  id: string
  client_id: string
  application_id: string | null
  assessment_date: string
  assessor: string | null
  physical_function: string | null
  cognitive_function: string | null
  environment: string | null
  device_needs: string | null
  recommendations: string | null
  notes: string | null
  ai_generated: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// ──────────────────────────────────────────────────────────────
// 상담기록지 (Consultation Records)
// ──────────────────────────────────────────────────────────────

export async function getConsultationRecordsByClient(
  clientId: string
): Promise<{ success: boolean; records?: ConsultationRecord[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from("eval_consultation_records")
    .select("*")
    .eq("client_id", clientId)
    .order("consultation_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[case-record-actions] getConsultationRecordsByClient:", error)
    return { success: false, error: "상담기록지 조회에 실패했습니다" }
  }
  return { success: true, records: data ?? [] }
}

export interface CreateConsultationRecordInput {
  client_id: string
  application_id?: string | null
  consultation_date: string
  consultation_type: string
  consultant?: string | null
  purpose?: string | null
  current_situation?: string | null
  content?: string | null
  result?: string | null
  next_plan?: string | null
  ai_generated?: boolean
}

export async function getConsultationRecordById(
  recordId: string
): Promise<{ success: boolean; record?: ConsultationRecord; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from("eval_consultation_records")
    .select("*")
    .eq("id", recordId)
    .single()

  if (error) {
    console.error("[case-record-actions] getConsultationRecordById:", error)
    return { success: false, error: "상담기록지를 찾을 수 없습니다" }
  }
  return { success: true, record: data }
}

export async function getAssessmentNoteById(
  noteId: string
): Promise<{ success: boolean; note?: AssessmentNote; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from("eval_assessment_notes")
    .select("*")
    .eq("id", noteId)
    .single()

  if (error) {
    console.error("[case-record-actions] getAssessmentNoteById:", error)
    return { success: false, error: "평가지를 찾을 수 없습니다" }
  }
  return { success: true, note: data }
}

export async function createConsultationRecord(
  input: CreateConsultationRecordInput
): Promise<{ success: boolean; record?: ConsultationRecord; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const { userId } = await auth()
  if (!userId) return { success: false, error: "로그인이 필요합니다" }

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from("eval_consultation_records")
    .insert({
      client_id: input.client_id,
      application_id: input.application_id ?? null,
      consultation_date: input.consultation_date,
      consultation_type: input.consultation_type,
      consultant: input.consultant ?? null,
      purpose: input.purpose ?? null,
      current_situation: input.current_situation ?? null,
      content: input.content ?? null,
      result: input.result ?? null,
      next_plan: input.next_plan ?? null,
      ai_generated: input.ai_generated ?? false,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error("[case-record-actions] createConsultationRecord:", error)
    return { success: false, error: "상담기록지 저장에 실패했습니다" }
  }

  revalidatePath(`/clients/${input.client_id}`)
  return { success: true, record: data }
}

export async function deleteConsultationRecord(
  recordId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from("eval_consultation_records")
    .delete()
    .eq("id", recordId)

  if (error) {
    console.error("[case-record-actions] deleteConsultationRecord:", error)
    return { success: false, error: "상담기록지 삭제에 실패했습니다" }
  }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

// ──────────────────────────────────────────────────────────────
// 평가지 (Assessment Notes)
// ──────────────────────────────────────────────────────────────

export async function getAssessmentNotesByClient(
  clientId: string
): Promise<{ success: boolean; notes?: AssessmentNote[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from("eval_assessment_notes")
    .select("*")
    .eq("client_id", clientId)
    .order("assessment_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[case-record-actions] getAssessmentNotesByClient:", error)
    return { success: false, error: "평가지 조회에 실패했습니다" }
  }
  return { success: true, notes: data ?? [] }
}

export interface CreateAssessmentNoteInput {
  client_id: string
  application_id?: string | null
  assessment_date: string
  assessor?: string | null
  physical_function?: string | null
  cognitive_function?: string | null
  environment?: string | null
  device_needs?: string | null
  recommendations?: string | null
  notes?: string | null
  ai_generated?: boolean
}

export async function createAssessmentNote(
  input: CreateAssessmentNoteInput
): Promise<{ success: boolean; note?: AssessmentNote; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const { userId } = await auth()
  if (!userId) return { success: false, error: "로그인이 필요합니다" }

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from("eval_assessment_notes")
    .insert({
      client_id: input.client_id,
      application_id: input.application_id ?? null,
      assessment_date: input.assessment_date,
      assessor: input.assessor ?? null,
      physical_function: input.physical_function ?? null,
      cognitive_function: input.cognitive_function ?? null,
      environment: input.environment ?? null,
      device_needs: input.device_needs ?? null,
      recommendations: input.recommendations ?? null,
      notes: input.notes ?? null,
      ai_generated: input.ai_generated ?? false,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error("[case-record-actions] createAssessmentNote:", error)
    return { success: false, error: "평가지 저장에 실패했습니다" }
  }

  revalidatePath(`/clients/${input.client_id}`)
  return { success: true, note: data }
}

export async function deleteAssessmentNote(
  noteId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from("eval_assessment_notes")
    .delete()
    .eq("id", noteId)

  if (error) {
    console.error("[case-record-actions] deleteAssessmentNote:", error)
    return { success: false, error: "평가지 삭제에 실패했습니다" }
  }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}
