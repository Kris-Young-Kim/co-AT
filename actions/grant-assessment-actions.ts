"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { upsertGrantItem } from "./grant-item-actions"

export interface GrantAssessmentListItem {
  id: string
  client_id: string
  client_name: string
  birth_date: string | null
  disability_type: string | null
  disability_grade: string | null
  assessment_year: number
  assessment_month: number | null
  referral_org: string | null
  evaluation_date: string | null
  final_result: string | null
  status: string
  item_count: number
  item_categories: string[] | null
  created_at: string
}

export interface GrantAssessmentItem {
  id: string
  item_order: number
  item_category: string
  item_name: string | null
  use_plan: string | null
  use_location: string | null
  use_location_detail: string | null
  usage_experience: boolean | null
  self_usage_possible: boolean | null
  support_person: string | null
  score_env: number | null
  score_operation: number | null
  score_disability: number | null
  score_use_plan: number | null
  score_effectiveness: number | null
  total_score: number | null
  checklist_responses: Record<string, boolean> | null
  item_opinion: string | null
  item_result: string | null
  recommended_model: string | null
  vendor_name: string | null
  vendor_phone: string | null
  support_amount: number | null
  has_self_pay: boolean | null
  final_item_name: string | null
  item_remarks: string | null
}

export interface GrantAssessmentDetail {
  id: string
  client_id: string
  application_id: string | null
  assessment_year: number
  assessment_month: number | null
  referral_org: string | null
  referral_doc_id: string | null
  evaluator_name: string | null
  evaluator_staff_id: string | null
  evaluation_date: string | null
  prior_grant_records: Array<{ year: number; agency: string; item: string }> | null
  disability_cause_1: string | null
  disability_onset_1: string | null
  disability_cause_2: string | null
  disability_onset_2: string | null
  disability_progression: string | null
  disability_status_desc: string | null
  general_opinion: string | null
  change_cancel_reason: string | null
  final_result: string | null
  status: string
  items: GrantAssessmentItem[]
}

export interface CreateGrantAssessmentInput {
  client_id: string
  application_id?: string | null
  assessment_year: number
  referral_org?: string | null
  referral_doc_id?: string | null
}

export interface UpdateGrantAssessmentInput {
  assessment_month?: number | null
  referral_org?: string | null
  referral_doc_id?: string | null
  evaluator_name?: string | null
  evaluator_staff_id?: string | null
  evaluation_date?: string | null
  prior_grant_records?: Array<{ year: number; agency: string; item: string }> | null
  disability_cause_1?: string | null
  disability_onset_1?: string | null
  disability_cause_2?: string | null
  disability_onset_2?: string | null
  disability_progression?: string | null
  disability_status_desc?: string | null
  general_opinion?: string | null
  change_cancel_reason?: string | null
  final_result?: string | null
  status?: string
}

export async function listGrantAssessments(options: {
  year?: number
  referralOrg?: string
  status?: string
  clientName?: string
  clientId?: string
} = {}): Promise<{ success: boolean; assessments?: GrantAssessmentListItem[]; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    let query = (supabase as any)
      .from("eval_grant_assessment_list")
      .select("*")
      .order("assessment_year", { ascending: false })
      .order("created_at", { ascending: false })

    if (options.year) query = query.eq("assessment_year", options.year)
    if (options.referralOrg) query = query.eq("referral_org", options.referralOrg)
    if (options.status) query = query.eq("status", options.status)
    if (options.clientName) query = query.ilike("client_name", `%${options.clientName}%`)
    if (options.clientId) query = query.eq("client_id", options.clientId)

    const { data, error } = await query
    if (error) return { success: false, error: "목록 조회에 실패했습니다" }
    return { success: true, assessments: (data ?? []) as GrantAssessmentListItem[] }
  } catch (e) {
    console.error("listGrantAssessments:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function getGrantAssessmentById(id: string): Promise<{
  success: boolean
  assessment?: GrantAssessmentDetail
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()

    const { data: a, error: aErr } = await (supabase as any)
      .from("eval_grant_assessments")
      .select("id,client_id,application_id,assessment_year,assessment_month,referral_org,referral_doc_id,evaluator_name,evaluator_staff_id,evaluation_date,prior_grant_records,disability_cause_1,disability_onset_1,disability_cause_2,disability_onset_2,disability_progression,disability_status_desc,general_opinion,change_cancel_reason,final_result,status")
      .eq("id", id)
      .single()

    if (aErr || !a) return { success: false, error: "교부사업 평가를 찾을 수 없습니다" }

    const { data: items, error: iErr } = await (supabase as any)
      .from("eval_grant_items")
      .select("id,item_order,item_category,item_name,use_plan,use_location,use_location_detail,usage_experience,self_usage_possible,support_person,score_env,score_operation,score_disability,score_use_plan,score_effectiveness,total_score,checklist_responses,item_opinion,item_result,recommended_model,vendor_name,vendor_phone,support_amount,has_self_pay,final_item_name,item_remarks")
      .eq("assessment_id", id)
      .order("item_order", { ascending: true })

    if (iErr) return { success: false, error: "품목 조회에 실패했습니다" }

    return {
      success: true,
      assessment: { ...(a as Omit<GrantAssessmentDetail, "items">), items: (items ?? []) as GrantAssessmentItem[] },
    }
  } catch (e) {
    console.error("getGrantAssessmentById:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function createGrantAssessment(input: CreateGrantAssessmentInput): Promise<{
  success: boolean; id?: string; error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const supabase = createAdminClient()

    const { data: profile } = await (supabase as any)
      .from("profiles").select("name").eq("clerk_user_id", userId).single()

    const { data, error } = await (supabase as any)
      .from("eval_grant_assessments")
      .insert({
        client_id: input.client_id,
        application_id: input.application_id ?? null,
        assessment_year: input.assessment_year,
        referral_org: input.referral_org ?? null,
        referral_doc_id: input.referral_doc_id ?? null,
        evaluator_staff_id: userId,
        evaluator_name: profile ? (profile as { name: string }).name : null,
        status: "draft",
      })
      .select("id")
      .single()

    if (error || !data) {
      console.error("createGrantAssessment DB error:", error)
      if (error?.code === "23505") return { success: false, error: "이 대상자는 해당 연도에 이미 평가가 등록되어 있습니다" }
      return { success: false, error: `교부사업 평가 생성에 실패했습니다: ${error?.message ?? "알 수 없는 오류"}` }
    }

    revalidatePath("/grant-eval")
    return { success: true, id: (data as { id: string }).id }
  } catch (e) {
    console.error("createGrantAssessment:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function updateGrantAssessment(
  id: string,
  input: UpdateGrantAssessmentInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from("eval_grant_assessments")
      .update(input)
      .eq("id", id)

    if (error) return { success: false, error: "수정에 실패했습니다" }

    revalidatePath("/grant-eval")
    revalidatePath(`/grant-eval/${id}`)
    return { success: true }
  } catch (e) {
    console.error("updateGrantAssessment:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function deleteGrantAssessment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from("eval_grant_assessments").delete().eq("id", id)

    if (error) return { success: false, error: "삭제에 실패했습니다" }

    revalidatePath("/grant-eval")
    return { success: true }
  } catch (e) {
    console.error("deleteGrantAssessment:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function submitGrantAssessment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from("eval_grant_assessments")
      .update({ status: "submitted" })
      .eq("id", id)
      .eq("status", "draft")
      .select("id")
      .single()

    if (error || !data) return { success: false, error: "제출에 실패했습니다. 이미 제출됐거나 존재하지 않는 평가입니다." }

    revalidatePath("/grant-eval")
    revalidatePath(`/grant-eval/${id}`)
    return { success: true }
  } catch (e) {
    console.error("submitGrantAssessment:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export interface ExtractedGrantFields {
  referral_org?: string | null
  general_opinion?: string | null
  prior_grant_records?: Array<{ year: number; agency: string; item: string }> | null
  items: Array<{
    item_order: number
    item_category?: string
    use_plan?: string | null
    use_location?: string | null
    use_location_detail?: string | null
    usage_experience?: boolean | null
    self_usage_possible?: boolean | null
    support_person?: string | null
    item_opinion?: string | null
  }>
}

export async function applyInterviewExtract(
  assessmentId: string,
  fields: ExtractedGrantFields
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const assessmentUpdates: UpdateGrantAssessmentInput = {}
    if (fields.referral_org != null) assessmentUpdates.referral_org = fields.referral_org
    if (fields.general_opinion != null) assessmentUpdates.general_opinion = fields.general_opinion
    if (fields.prior_grant_records != null) assessmentUpdates.prior_grant_records = fields.prior_grant_records

    if (Object.keys(assessmentUpdates).length > 0) {
      const result = await updateGrantAssessment(assessmentId, assessmentUpdates)
      if (!result.success) return { success: false, error: result.error }
    }

    for (const item of fields.items) {
      const itemInput: Parameters<typeof upsertGrantItem>[2] = {}
      if (item.item_category != null) itemInput.item_category = item.item_category
      if (item.use_plan != null) itemInput.use_plan = item.use_plan
      if (item.use_location != null) itemInput.use_location = item.use_location
      if (item.use_location_detail != null) itemInput.use_location_detail = item.use_location_detail
      if (item.usage_experience != null) itemInput.usage_experience = item.usage_experience
      if (item.self_usage_possible != null) itemInput.self_usage_possible = item.self_usage_possible
      if (item.support_person != null) itemInput.support_person = item.support_person
      if (item.item_opinion != null) itemInput.item_opinion = item.item_opinion

      const result = await upsertGrantItem(assessmentId, item.item_order, itemInput)
      if (!result.success) return { success: false, error: result.error }
    }

    revalidatePath(`/grant-eval/${assessmentId}`)
    return { success: true }
  } catch (e) {
    console.error("applyInterviewExtract:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}
