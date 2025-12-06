"use server"

import { createClient } from "@/lib/supabase/server"
import { type ApplicationForm } from "@/lib/validators"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

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

    // 클라이언트 정보 조회 또는 생성
    // TODO: 실제로는 클라이언트 정보를 먼저 확인하고 없으면 생성해야 함
    // 여기서는 간단히 profile.id를 client_id로 사용 (실제로는 별도 clients 테이블 조회 필요)
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", profile.id) // 임시로 profile.id 사용 (실제로는 별도 로직 필요)
      .single()

    let clientId: string

    if (clientError || !client) {
      // 클라이언트가 없으면 생성 (실제로는 더 많은 정보 필요)
      const { data: newClient, error: createClientError } = await supabase
        .from("clients")
        .insert({
          name: formData.contact, // 임시 (실제로는 폼에서 이름 받아야 함)
        })
        .select("id")
        .single()

      if (createClientError || !newClient) {
        return { success: false, error: "클라이언트 정보 생성에 실패했습니다" }
      }

      clientId = newClient.id
    } else {
      clientId = client.id
    }

    // 신청서 생성
    const applicationData: {
      client_id: string
      category: string | null
      sub_category: string | null
      desired_date: string | null
      status: string
      service_year: number | null
    } = {
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

    revalidatePath("/portal/apply")
    revalidatePath("/portal/mypage")

    return {
      success: true,
      applicationId: application.id,
    }
  } catch (error) {
    console.error("Unexpected error in createApplication:", error)
    return {
      success: false,
      error: "예상치 못한 오류가 발생했습니다",
    }
  }
}

