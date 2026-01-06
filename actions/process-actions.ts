"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export interface ProcessLogInput {
  application_id: string
  client_id: string
  log_date: string
  service_area?: string
  funding_source?: string
  funding_detail?: string
  process_step?: string
  item_name?: string
  content?: string
  remarks?: string
}

/**
 * 서비스 진행 기록지 생성 (첨부 20)
 */
export async function createProcessLog(
  input: ProcessLogInput
): Promise<{
  success: boolean
  processLogId?: string
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

    // 담당자 ID 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    const { data, error } = await supabase
      .from("process_logs")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
      .insert({
        application_id: input.application_id,
        staff_id: profile ? (profile as { id: string }).id : null,
        log_date: input.log_date,
        service_area: input.service_area || null,
        funding_source: input.funding_source || null,
        process_step: input.process_step || null,
        item_name: input.item_name || null,
        content: input.content || null,
        remarks: input.remarks || null,
      })
      .select("id")
      .single()

    if (error) {
      console.error("서비스 진행 기록 생성 실패:", error)
      return {
        success: false,
        error: "서비스 진행 기록 생성에 실패했습니다: " + (error.message || "알 수 없는 오류"),
      }
    }

    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${input.client_id}`)

    return { success: true, processLogId: (data as { id: string }).id }
  } catch (error) {
    console.error("Unexpected error in createProcessLog:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

