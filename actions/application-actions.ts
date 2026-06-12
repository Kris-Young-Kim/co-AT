"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type ApplicationForm } from "@/lib/validators"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { Database } from "@/types/database.types"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"]

export type Application = Database["public"]["Tables"]["applications"]["Row"]

export async function getApplicationsByClientId(clientId: string): Promise<{
  success: boolean
  applications?: Application[]
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: '신청서 조회에 실패했습니다' }
  return { success: true, applications: data ?? [] }
}

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
      // 클라이언트가 없으면 생성 (id를 profileId로 설정하여 1:1 관계 유지)
      const clientData: ClientInsert = {
        id: profileId, // profile.id를 client.id로 사용
        name: formData.contact || "신청자", // 임시 (실제로는 폼에서 이름 받아야 함)
      }
      const { data: newClient, error: createClientError } = await supabase
        .from("clients")
        // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
        .insert(clientData)
        .select("id")
        .single()

      if (createClientError || !newClient) {
        console.error("Client creation error:", createClientError)
        return { success: false, error: "클라이언트 정보 생성에 실패했습니다: " + (createClientError?.message || "알 수 없는 오류") }
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

    // 감사 로그 기록
    const { logAuditEvent } = await import("@/lib/utils/audit-logger")
    await logAuditEvent({
      action_type: "create",
      table_name: "applications",
      record_id: applicationId,
      new_values: applicationData as Record<string, unknown>,
      application_id: applicationId,
      client_id: clientId,
      description: `신청서 접수: ${formData.category} - ${formData.sub_category || ""}`,
    })

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

    revalidatePath("/apply")
    revalidatePath("/mypage")
    revalidatePath("/schedule")
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

export interface CreateApplicationWithPendingClientInput {
  name: string
  birth_date?: string | null
  gender?: string | null
  contact?: string | null
  disability_type?: string | null
  disability_grade?: string | null
  economic_status?: string | null
  category: string
  sub_category?: string | null
  desired_date?: string | null
}

export async function createApplicationWithPendingClient(
  input: CreateApplicationWithPendingClientInput
): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const supabase = createAdminClient()

    // 1. Find or create client linked to this portal user
    const { data: existingClient } = await (supabase as any)
      .from("clients")
      .select("id")
      .eq("portal_user_id", userId)
      .maybeSingle()

    let clientId: string

    if (existingClient) {
      clientId = (existingClient as { id: string }).id
    } else {
      const { data: clientData, error: clientError } = await (supabase as any)
        .from("clients")
        .insert({
          name: input.name,
          birth_date: input.birth_date ?? null,
          gender: input.gender ?? null,
          contact: input.contact ?? null,
          disability_type: input.disability_type ?? null,
          disability_grade: input.disability_grade ?? null,
          economic_status: input.economic_status ?? null,
          status: "pending",
          source: "portal",
          portal_user_id: userId,
        })
        .select("id")
        .single()

      if (clientError || !clientData) {
        console.error("createApplicationWithPendingClient (client):", clientError)
        return { success: false, error: "클라이언트 생성에 실패했습니다" }
      }
      clientId = (clientData as { id: string }).id
    }

    // 2. Create application linked to the pending client
    const applicationData = {
      client_id: clientId,
      category: input.category,
      sub_category: input.sub_category ?? null,
      desired_date: input.desired_date ?? null,
      status: "접수",
      service_year: new Date().getFullYear(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: appData, error: appError } = await (supabase as any)
      .from("applications")
      .insert(applicationData)
      .select("id")
      .single()

    if (appError || !appData) {
      console.error("createApplicationWithPendingClient (application):", appError)
      return { success: false, error: "신청서 생성에 실패했습니다" }
    }

    const applicationId = (appData as { id: string }).id

    // 3. Audit log
    const { logAuditEvent } = await import("@/lib/utils/audit-logger")
    await logAuditEvent({
      action_type: "create",
      table_name: "applications",
      record_id: applicationId,
      new_values: applicationData as Record<string, unknown>,
      application_id: applicationId,
      client_id: clientId,
      description: `포털 신청서 접수: ${input.category}${input.sub_category ? " - " + input.sub_category : ""}`,
    })

    // 4. Auto-create schedule if desired_date is set
    if (input.desired_date) {
      try {
        const scheduleTypeMap: Record<string, "visit" | "consult" | "assessment" | "delivery" | "pickup" | "exhibition" | "education"> = {
          consult: "consult",
          experience: "visit",
          custom: "visit",
          aftercare: "visit",
          education: "education",
        }
        const scheduleType = scheduleTypeMap[input.category] ?? "consult"

        const { createSchedule } = await import("./schedule-actions")
        await createSchedule({
          application_id: applicationId,
          client_id: clientId,
          schedule_type: scheduleType,
          scheduled_date: input.desired_date,
          notes: `신청 접수 시 자동 생성된 일정 (${input.category})`,
          status: "scheduled",
        })
      } catch (err) {
        console.error("[포털 신청] 일정 자동 생성 실패:", err)
        // non-fatal: application creation already succeeded
      }
    }

    // 5. Auto-create call_log with channel='web'
    try {
      const CATEGORY_LABEL: Record<string, string> = {
        consult: "상담",
        experience: "체험·시연",
        custom: "맞춤형 지원",
        aftercare: "사후관리",
        education: "교육·홍보",
      }
      const catLabel = CATEGORY_LABEL[input.category] ?? input.category
      const subLabel = input.sub_category ? ` — ${input.sub_category}` : ""
      await supabase.from("call_logs").insert({
        log_date: new Date().toISOString().slice(0, 10),
        channel: "web",
        application_id: applicationId,
        target_name: input.name,
        target_disability_type: input.disability_type ?? null,
        target_economic_status: input.economic_status ?? null,
        q_device: true,
        question_content: `온라인 신청: ${catLabel}${subLabel}`,
        staff_name: "온라인 신청",
      })
    } catch (err) {
      console.error("[포털 신청] call_log 자동 생성 실패:", err)
      // non-fatal
    }

    revalidatePath("/apply")
    revalidatePath("/mypage")
    revalidatePath("/")

    return { success: true, applicationId }
  } catch (error) {
    console.error("Unexpected error in createApplicationWithPendingClient:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export interface ApplicationDetailsInput {
  applicationId: string
  clientId: string
  referral_type?: string | null
  progress_type?: string | null
  category?: string | null
  sub_category?: string | null
  requested_item?: string | null
  service_area?: string | null
  status?: string | null
  visit_type?: string | null
  notes?: string | null
}

export async function updateApplicationDetails(
  input: ApplicationDetailsInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = await createClient()
    const { error } = await supabase
      .from('applications')
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
      .update({
        referral_type: input.referral_type ?? null,
        progress_type: input.progress_type ?? null,
        category: input.category ?? null,
        sub_category: input.sub_category ?? null,
        requested_item: input.requested_item ?? null,
        service_area: input.service_area ?? null,
        status: input.status ?? null,
        visit_type: input.visit_type ?? null,
        notes: input.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.applicationId)

    if (error) {
      console.error('updateApplicationDetails:', error)
      return { success: false, error: '신청서 수정에 실패했습니다: ' + error.message }
    }

    revalidatePath(`/clients/${input.clientId}`)
    revalidatePath(`/clients/${input.clientId}/applications/${input.applicationId}`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in updateApplicationDetails:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다' }
  }
}

