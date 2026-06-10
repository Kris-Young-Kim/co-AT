"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export interface IPPAItem {
  problem: string
  pre_score: number   // 0–5, higher = more difficulty
  post_score: number | null
}

export interface IPPAAssessment {
  id: string
  client_id: string
  assessment_year: number
  pre_date: string | null
  post_date: string | null
  items: IPPAItem[]
  outcome_score: number | null
  notes: string | null
  status: "pre_only" | "completed"
  staff_id: string | null
  created_at: string
  updated_at: string
}

export interface CreateIPPAInput {
  assessment_year: number
  pre_date: string
  items: Array<{ problem: string; pre_score: number }>
  notes?: string | null
}

export interface SavePostInput {
  post_date: string
  items: Array<{ problem: string; pre_score: number; post_score: number }>
}

function calcOutcome(items: IPPAItem[]): number | null {
  const completed = items.filter(
    (it) => it.post_score !== null && it.post_score !== undefined
  )
  if (completed.length === 0) return null
  const sum = completed.reduce(
    (acc, it) => acc + (it.pre_score - (it.post_score as number)),
    0
  )
  return Math.round((sum / completed.length) * 100) / 100
}

export async function getClientIPPAAssessments(clientId: string): Promise<{
  success: boolean
  assessments?: IPPAAssessment[]
  error?: string
}> {
  const allowed = await hasAdminOrStaffPermission()
  if (!allowed) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from("eval_ippa_assessments")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, assessments: (data ?? []) as IPPAAssessment[] }
}

export async function createIPPAAssessment(
  clientId: string,
  input: CreateIPPAInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const allowed = await hasAdminOrStaffPermission()
  if (!allowed) return { success: false, error: "권한이 없습니다" }

  const { userId } = await auth()
  if (!userId) return { success: false, error: "로그인이 필요합니다" }

  if (input.items.length < 3 || input.items.length > 5) {
    return { success: false, error: "활동 문제는 3~5개 선정해야 합니다" }
  }

  const items: IPPAItem[] = input.items.map((it) => ({
    problem: it.problem.trim(),
    pre_score: it.pre_score,
    post_score: null,
  }))

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from("eval_ippa_assessments")
    .insert({
      client_id: clientId,
      assessment_year: input.assessment_year,
      pre_date: input.pre_date,
      items,
      notes: input.notes ?? null,
      status: "pre_only",
      staff_id: userId,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/clients/${clientId}`)
  return { success: true, id: data.id }
}

export async function saveIPPAPostMeasurement(
  assessmentId: string,
  clientId: string,
  input: SavePostInput
): Promise<{ success: boolean; outcomeScore?: number | null; error?: string }> {
  const allowed = await hasAdminOrStaffPermission()
  if (!allowed) return { success: false, error: "권한이 없습니다" }

  const items: IPPAItem[] = input.items.map((it) => ({
    problem: it.problem,
    pre_score: it.pre_score,
    post_score: it.post_score,
  }))

  const outcomeScore = calcOutcome(items)

  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from("eval_ippa_assessments")
    .update({
      post_date: input.post_date,
      items,
      outcome_score: outcomeScore,
      status: "completed",
    })
    .eq("id", assessmentId)
    .eq("client_id", clientId)

  if (error) return { success: false, error: error.message }
  revalidatePath(`/clients/${clientId}`)
  return { success: true, outcomeScore }
}

export async function deleteIPPAAssessment(
  assessmentId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const allowed = await hasAdminOrStaffPermission()
  if (!allowed) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from("eval_ippa_assessments")
    .delete()
    .eq("id", assessmentId)
    .eq("client_id", clientId)

  if (error) return { success: false, error: error.message }
  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}
