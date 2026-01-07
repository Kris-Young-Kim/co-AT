"use server"

import { createClient } from "@/lib/supabase/server"
import { type ApplicationForm } from "@/lib/validators"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { Database } from "@/types/database.types"

type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"]

export async function createApplication(
  formData: ApplicationForm
): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다" }
    }

    const supabase = await createClient()

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "사용자 정보를 찾을 수 없습니다" }
    }

    const profileId = (profile as { id: string }).id

    if (!profileId) {
      return { success: false, error: "사용자 정보를 찾을 수 없습니다" }
    }

    // 클라이언트 정보 조회 또는 생성
    // TODO: 실제로는 클라이언트 정보를 먼저 확인하고 없으면 생성해야 함
    // 여기서는 간단히 profile.id를 client_id로 사용 (실제로는 별도 clients 테이블 조회 필요)
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", profileId) // 임시로 profile.id 사용 (실제로는 별도 로직 필요)
      .single()

    let clientId: string

    if (clientError || !client) {
      // 클라이언트가 없으면 생성 (실제로는 더 많은 정보 필요)
      const clientData: ClientInsert = {
        name: formData.contact, // 임시 (실제로는 폼에서 이름 받아야 함)
      }
      const { data: newClient, error: createClientError } = await supabase
        .from("clients")
        // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
        .insert(clientData)
        .select("id")
        .single()

      if (createClientError || !newClient) {
        return { success: false, error: "클라이언트 정보 생성에 실패했습니다" }
      }

      clientId = (newClient as { id: string }).id
    } else {
      clientId = (client as { id: string }).id
    }

    // 신청서 생성
    const applicationData = {
      client_id: clientId,
      category: formData.category,
      sub_category: formData.sub_category || null,
      desired_date: formData.desired_date
        ? formData.desired_date.toISOString().split("T")[0]
        : null,
      status: "접수",
      service_year: new Date().getFullYear(),
    }

    const { data: application, error: applicationError } = await supabase
      .from("applications")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
      .insert(applicationData)
      .select("id")
      .single()

    if (applicationError || !application) {
      console.error("Application creation error:", applicationError)
      return {
        success: false,
        error: "신청서 생성에 실패했습니다: " + (applicationError?.message || "알 수 없는 오류"),
      }
    }

    const applicationId = (application as { id: string }).id

    // 워크플로우 자동화: 신청 접수 시 desired_date가 있으면 일정 자동 생성
    if (formData.desired_date) {
      try {
        // 일정 타입 결정 (카테고리별)
        let scheduleType: "visit" | "consult" | "assessment" | "delivery" | "pickup" | "exhibition" | "education" = "consult"
        
        if (formData.category === "consult") {
          scheduleType = "consult"
        } else if (formData.category === "experience") {
          scheduleType = "visit"
        } else if (formData.category === "custom") {
          scheduleType = "visit"
        } else if (formData.category === "aftercare") {
          scheduleType = "visit"
        } else if (formData.category === "education") {
          scheduleType = "education"
        }

        // 일정 생성 (createSchedule 함수 import 필요)
        const { createSchedule } = await import("./schedule-actions")
        const scheduleResult = await createSchedule({
          application_id: applicationId,
          client_id: clientId,
          schedule_type: scheduleType,
          scheduled_date: formData.desired_date.toISOString().split("T")[0],
          notes: `신청 접수 시 자동 생성된 일정 (${formData.category})`,
          status: "scheduled",
        })

        if (scheduleResult.success) {
          console.log("[워크플로우 자동화] 신청 접수 시 일정 자동 생성 성공:", scheduleResult.data?.id)
        } else {
          console.error("[워크플로우 자동화] 일정 자동 생성 실패:", scheduleResult.error)
        }
      } catch (error) {
        console.error("[워크플로우 자동화] 일정 자동 생성 중 오류:", error)
        // 일정 생성 실패해도 신청서 생성은 성공으로 처리
      }
    }

    revalidatePath("/portal/apply")
    revalidatePath("/portal/mypage")
    revalidatePath("/admin/schedule")
    revalidatePath("/")

    return {
      success: true,
      applicationId,
    }
  } catch (error) {
    console.error("Unexpected error in createApplication:", error)
    return {
      success: false,
      error: "예상치 못한 오류가 발생했습니다",
    }
  }
}

