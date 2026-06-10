"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import type { GrantReferralContent } from "@co-at/types"

// ── Approval-sourced grant referral documents ─────────────

export interface ApprovalGrantDoc {
  id: string
  title: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  created_at: string
  content: GrantReferralContent
  step1_status: string | null
  step2_status: string | null
}

export async function listApprovalGrantDocs(
  year?: number
): Promise<{ success: boolean; docs?: ApprovalGrantDoc[]; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()

    let query = (supabase as any)
      .from("approval_documents")
      .select(`
        id,
        title,
        status,
        created_at,
        content,
        approval_steps ( step, status )
      `)
      .eq("type", "grant_referral")
      .order("created_at", { ascending: false })

    if (year) {
      query = query
        .gte("created_at", `${year}-01-01`)
        .lt("created_at", `${year + 1}-01-01`)
    }

    const { data, error } = await query
    if (error) return { success: false, error: "접수공문 조회에 실패했습니다" }

    const docs: ApprovalGrantDoc[] = (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      created_at: row.created_at,
      content: row.content as GrantReferralContent,
      step1_status: (row.approval_steps ?? []).find((s: any) => s.step === 1)?.status ?? null,
      step2_status: (row.approval_steps ?? []).find((s: any) => s.step === 2)?.status ?? null,
    }))

    return { success: true, docs }
  } catch (e) {
    console.error("listApprovalGrantDocs:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export interface GrantReferralDoc {
  id: string
  doc_year: number
  doc_number: string | null
  sending_org: string
  doc_date: string | null
  receive_date: string | null
  referral_round: number | null
  referral_count: number
  assessment_count: number
  assessment_items_count: number
  cancel_count: number
  result_send_date: string | null
  note: string | null
  created_at: string
}

export interface GrantReferralDocInput {
  doc_year: number
  doc_number?: string | null
  sending_org: string
  doc_date?: string | null
  receive_date?: string | null
  referral_round?: number | null
  referral_count?: number
  result_send_date?: string | null
  note?: string | null
}

export async function listGrantReferralDocs(
  year?: number
): Promise<{ success: boolean; docs?: GrantReferralDoc[]; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    let query = (supabase as any)
      .from("eval_grant_referral_docs")
      .select("*")
      .order("doc_year", { ascending: false })
      .order("created_at", { ascending: false })

    if (year) query = query.eq("doc_year", year)

    const { data, error } = await query
    if (error) return { success: false, error: "접수공문 목록 조회에 실패했습니다" }
    return { success: true, docs: (data ?? []) as GrantReferralDoc[] }
  } catch (e) {
    console.error("listGrantReferralDocs:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function createGrantReferralDoc(
  input: GrantReferralDocInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from("eval_grant_referral_docs")
      .insert({ ...input, created_by: userId })
      .select("id")
      .single()

    if (error || !data) return { success: false, error: "접수공문 생성에 실패했습니다" }

    revalidatePath("/grant-eval/referrals")
    return { success: true, id: (data as { id: string }).id }
  } catch (e) {
    console.error("createGrantReferralDoc:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function updateGrantReferralDoc(
  id: string,
  input: Partial<GrantReferralDocInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from("eval_grant_referral_docs")
      .update(input)
      .eq("id", id)

    if (error) return { success: false, error: "접수공문 수정에 실패했습니다" }

    revalidatePath("/grant-eval/referrals")
    return { success: true }
  } catch (e) {
    console.error("updateGrantReferralDoc:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function deleteGrantReferralDoc(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from("eval_grant_referral_docs")
      .delete()
      .eq("id", id)

    if (error) return { success: false, error: "접수공문 삭제에 실패했습니다" }

    revalidatePath("/grant-eval/referrals")
    return { success: true }
  } catch (e) {
    console.error("deleteGrantReferralDoc:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}
