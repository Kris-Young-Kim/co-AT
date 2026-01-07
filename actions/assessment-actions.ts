"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export type AssessmentDomainType = "WC" | "ADL" | "S" | "SP" | "EC" | "CA" | "L" | "AAC" | "AM"

export interface DomainAssessmentInput {
  application_id: string
  domain_type: AssessmentDomainType
  evaluation_date: string
  evaluation_data?: any
  measurements?: Record<string, number>
  evaluator_opinion?: string
  recommended_device?: string
  future_plan?: string
}

/**
 * 영역별 평가 생성 (첨부 21)
 */
export async function createDomainAssessment(
  input: DomainAssessmentInput
): Promise<{
  success: boolean
  assessmentId?: string
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다" }
    }

    const supabase = await createClient()

    // 평가자 ID 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    const profileId = profile ? (profile as { id: string }).id : null

    const { data, error } = await supabase
      .from("domain_assessments")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
      .insert({
        application_id: input.application_id,
        evaluator_id: profileId,
        domain_type: input.domain_type,
        evaluation_date: input.evaluation_date,
        evaluation_data: input.evaluation_data || null,
        measurements: input.measurements || null,
        evaluator_opinion: input.evaluator_opinion || null,
        recommended_device: input.recommended_device || null,
        future_plan: input.future_plan || null,
      })
      .select("id")
      .single()

    if (error) {
      console.error("평가 생성 실패:", error)
      return {
        success: false,
        error: "평가 생성에 실패했습니다: " + (error.message || "알 수 없는 오류"),
      }
    }

    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${input.application_id}`)

    return { success: true, assessmentId: (data as { id: string }).id }
  } catch (error) {
    console.error("Unexpected error in createDomainAssessment:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 영역별 평가 조회
 */
export async function getDomainAssessments(
  applicationId: string
): Promise<{
  success: boolean
  assessments?: any[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("domain_assessments")
      .select("*")
      .eq("application_id", applicationId)
      .order("evaluation_date", { ascending: false })

    if (error) {
      console.error("평가 조회 실패:", error)
      return { success: false, error: "평가 조회에 실패했습니다" }
    }

    return { success: true, assessments: data || [] }
  } catch (error) {
    console.error("Unexpected error in getDomainAssessments:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 특정 평가 조회
 */
export async function getDomainAssessmentById(
  assessmentId: string
): Promise<{
  success: boolean
  assessment?: any
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("domain_assessments")
      .select("*")
      .eq("id", assessmentId)
      .single()

    if (error) {
      console.error("평가 조회 실패:", error)
      return { success: false, error: "평가 조회에 실패했습니다" }
    }

    return { success: true, assessment: data }
  } catch (error) {
    console.error("Unexpected error in getDomainAssessmentById:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 평가 수정
 */
export async function updateDomainAssessment(
  assessmentId: string,
  updates: Partial<DomainAssessmentInput>
): Promise<{
  success: boolean
  assessment?: any
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.evaluation_date) updateData.evaluation_date = updates.evaluation_date
    if (updates.evaluation_data !== undefined) updateData.evaluation_data = updates.evaluation_data
    if (updates.measurements !== undefined) updateData.measurements = updates.measurements
    if (updates.evaluator_opinion !== undefined) updateData.evaluator_opinion = updates.evaluator_opinion
    if (updates.recommended_device !== undefined) updateData.recommended_device = updates.recommended_device
    if (updates.future_plan !== undefined) updateData.future_plan = updates.future_plan

    const { data, error } = await supabase
      .from("domain_assessments")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
      .update(updateData)
      .eq("id", assessmentId)
      .select()
      .single()

    if (error) {
      console.error("평가 수정 실패:", error)
      return { success: false, error: "평가 수정에 실패했습니다" }
    }

    revalidatePath("/admin/clients")

    return { success: true, assessment: data }
  } catch (error) {
    console.error("Unexpected error in updateDomainAssessment:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}
