"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export interface IntakeRecordInput {
  application_id: string
  client_id: string
  consult_date: string
  body_function_data?: any
  cognitive_sensory_check?: string[]
  current_devices?: Array<{
    name: string
    in_use: boolean
    source: string
    year: string
  }>
  consultation_content?: string
  main_activity_place?: string
  activity_posture?: string
  main_supporter?: string
  environment_limitations?: string
}

/**
 * 상담 기록지 생성 (첨부 19)
 */
export async function createIntakeRecord(
  input: IntakeRecordInput
): Promise<{
  success: boolean
  intakeRecordId?: string
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

    // 상담자 ID 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    const profileId = profile ? (profile as { id: string }).id : null

    const { data, error } = await supabase
      .from("intake_records")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
      .insert({
        application_id: input.application_id,
        consultant_id: profileId,
        consult_date: input.consult_date,
        body_function_data: input.body_function_data || null,
        cognitive_sensory_check: input.cognitive_sensory_check || null,
        current_devices: input.current_devices || null,
        consultation_content: input.consultation_content || null,
        main_activity_place: input.main_activity_place || null,
        activity_posture: input.activity_posture || null,
        main_supporter: input.main_supporter || null,
        environment_limitations: input.environment_limitations || null,
      })
      .select("id")
      .single()

    if (error) {
      console.error("상담 기록 생성 실패:", error)
      return {
        success: false,
        error: "상담 기록 생성에 실패했습니다: " + (error.message || "알 수 없는 오류"),
      }
    }

    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${input.client_id}`)

    return { success: true, intakeRecordId: (data as { id: string }).id }
  } catch (error) {
    console.error("Unexpected error in createIntakeRecord:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

