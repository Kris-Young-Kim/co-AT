"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission, getCurrentUserProfileId } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { checkRepairLimit } from "./business-actions"

export interface ServiceLogItem {
  id: string
  application_id: string
  staff_id: string | null
  inventory_id: string | null
  service_date: string
  service_type: string | null
  service_area: string | null
  funding_source: string | null
  funding_detail: string | null
  work_type: string | null
  item_name: string | null
  work_description: string | null
  work_result: string | null
  cost_total: number | null
  cost_materials: number | null
  cost_labor: number | null
  cost_other: number | null
  images_before: string[] | null
  images_after: string[] | null
  remarks: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateServiceLogInput {
  application_id: string
  service_date: string
  service_type?: string
  service_area?: string
  funding_source?: string
  funding_detail?: string
  work_type?: string
  item_name?: string
  work_description?: string
  work_result?: string
  cost_total?: number | null
  cost_materials?: number | null
  cost_labor?: number | null
  cost_other?: number | null
  images_before?: string[]
  images_after?: string[]
  remarks?: string
  notes?: string
  inventory_id?: string | null
}

/**
 * 서비스 로그 생성 (수리비 한도 체크 포함)
 */
export async function createServiceLog(
  input: CreateServiceLogInput
): Promise<{
  success: boolean
  serviceLog?: ServiceLogItem
  error?: string
  limitCheck?: {
    currentTotal: number
    newTotal: number
    limit: number
    isExceeded: boolean
  }
}> {
  try {
    console.log("[Service Log Actions] 서비스 로그 생성 시작:", input)

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다" }
    }

    const supabase = await createClient()

    // application_id로 client_id 조회
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("client_id")
      .eq("id", input.application_id)
      .single()

    if (appError || !application) {
      console.error("[Service Log Actions] 신청서 조회 실패:", appError)
      return { success: false, error: "신청서 정보를 찾을 수 없습니다" }
    }

    const clientId = application.client_id

    // 수리비 한도 체크 (service_type이 'repair'이고 cost_total이 있는 경우)
    if (input.service_type === "repair" && input.cost_total && input.cost_total > 0) {
      console.log("[Service Log Actions] 수리비 한도 체크 시작:", {
        clientId,
        costTotal: input.cost_total,
      })

      const limitCheck = await checkRepairLimit(clientId, input.cost_total)

      if (!limitCheck.success) {
        return {
          success: false,
          error: limitCheck.error || "수리비 한도 체크에 실패했습니다",
        }
      }

      if (limitCheck.isExceeded) {
        console.warn("[Service Log Actions] 수리비 한도 초과:", {
          clientId,
          currentTotal: limitCheck.currentTotal,
          newAmount: input.cost_total,
          newTotal: limitCheck.newTotal,
          limit: limitCheck.limit,
        })

        // 한도 초과 시에도 계속 진행할 수 있도록 limitCheck 정보 반환
        // (UI에서 경고 다이얼로그를 표시하고 사용자가 확인하면 진행)
        return {
          success: false,
          error: "수리비 한도 초과",
          limitCheck: {
            currentTotal: limitCheck.currentTotal || 0,
            newTotal: limitCheck.newTotal || 0,
            limit: limitCheck.limit || 100000,
            isExceeded: true,
          },
        }
      }

      console.log("[Service Log Actions] 수리비 한도 체크 통과:", {
        currentTotal: limitCheck.currentTotal,
        newTotal: limitCheck.newTotal,
        limit: limitCheck.limit,
      })
    }

    // 담당자 ID 조회
    const staffId = await getCurrentUserProfileId()

    // 서비스 로그 생성
    const { data, error } = await supabase
      .from("service_logs")
      .insert({
        application_id: input.application_id,
        staff_id: staffId,
        inventory_id: input.inventory_id || null,
        service_date: input.service_date,
        service_type: input.service_type || null,
        service_area: input.service_area || null,
        funding_source: input.funding_source || null,
        funding_detail: input.funding_detail || null,
        work_type: input.work_type || null,
        item_name: input.item_name || null,
        work_description: input.work_description || null,
        work_result: input.work_result || null,
        cost_total: input.cost_total || null,
        cost_materials: input.cost_materials || null,
        cost_labor: input.cost_labor || null,
        cost_other: input.cost_other || null,
        images_before: input.images_before || null,
        images_after: input.images_after || null,
        remarks: input.remarks || null,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[Service Log Actions] 서비스 로그 생성 실패:", error)
      return { success: false, error: "서비스 로그 생성에 실패했습니다" }
    }

    console.log("[Service Log Actions] 서비스 로그 생성 성공:", data.id)

    // 감사 로그 기록
    const { logAuditEvent } = await import("@/lib/utils/audit-logger")
    await logAuditEvent({
      action_type: "create",
      table_name: "service_logs",
      record_id: data.id,
      new_values: data as Record<string, unknown>,
      application_id: input.application_id,
      client_id: clientId,
      description: `서비스 로그 생성: ${input.service_type || ""} - ${input.item_name || ""}`,
    })

    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${clientId}`)
    revalidatePath("/clients")
    revalidatePath(`/clients/${clientId}`)

    return { success: true, serviceLog: data }
  } catch (error) {
    console.error("[Service Log Actions] 서비스 로그 생성 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 서비스 로그 수정
 */
export async function updateServiceLog(
  id: string,
  input: Partial<CreateServiceLogInput>
): Promise<{
  success: boolean
  serviceLog?: ServiceLogItem
  error?: string
  limitCheck?: {
    currentTotal: number
    newTotal: number
    limit: number
    isExceeded: boolean
  }
}> {
  try {
    console.log("[Service Log Actions] 서비스 로그 수정 시작:", { id, input })

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 기존 서비스 로그 조회
    const { data: existingLog, error: fetchError } = await supabase
      .from("service_logs")
      .select("application_id, service_type, cost_total, applications!inner(client_id)")
      .eq("id", id)
      .single()

    if (fetchError || !existingLog) {
      return { success: false, error: "서비스 로그를 찾을 수 없습니다" }
    }

    const clientId = (existingLog.applications as any).client_id

    // 수리비가 변경되고 한도 초과 가능성이 있는 경우 체크
    if (
      input.service_type === "repair" &&
      input.cost_total !== undefined &&
      input.cost_total !== existingLog.cost_total &&
      input.cost_total > 0
    ) {
      const limitCheck = await checkRepairLimit(clientId, input.cost_total)

      if (!limitCheck.success) {
        return {
          success: false,
          error: limitCheck.error || "수리비 한도 체크에 실패했습니다",
        }
      }

      if (limitCheck.isExceeded) {
        return {
          success: false,
          error: "수리비 한도 초과",
          limitCheck: {
            currentTotal: limitCheck.currentTotal || 0,
            newTotal: limitCheck.newTotal || 0,
            limit: limitCheck.limit || 100000,
            isExceeded: true,
          },
        }
      }
    }

    // 서비스 로그 수정
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (input.service_date !== undefined) updateData.service_date = input.service_date
    if (input.service_type !== undefined) updateData.service_type = input.service_type
    if (input.service_area !== undefined) updateData.service_area = input.service_area
    if (input.funding_source !== undefined) updateData.funding_source = input.funding_source
    if (input.funding_detail !== undefined) updateData.funding_detail = input.funding_detail
    if (input.work_type !== undefined) updateData.work_type = input.work_type
    if (input.item_name !== undefined) updateData.item_name = input.item_name
    if (input.work_description !== undefined) updateData.work_description = input.work_description
    if (input.work_result !== undefined) updateData.work_result = input.work_result
    if (input.cost_total !== undefined) updateData.cost_total = input.cost_total
    if (input.cost_materials !== undefined) updateData.cost_materials = input.cost_materials
    if (input.cost_labor !== undefined) updateData.cost_labor = input.cost_labor
    if (input.cost_other !== undefined) updateData.cost_other = input.cost_other
    if (input.images_before !== undefined) updateData.images_before = input.images_before
    if (input.images_after !== undefined) updateData.images_after = input.images_after
    if (input.remarks !== undefined) updateData.remarks = input.remarks
    if (input.notes !== undefined) updateData.notes = input.notes
    if (input.inventory_id !== undefined) updateData.inventory_id = input.inventory_id

    const { data, error } = await supabase
      .from("service_logs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Service Log Actions] 서비스 로그 수정 실패:", error)
      return { success: false, error: "서비스 로그 수정에 실패했습니다" }
    }

    console.log("[Service Log Actions] 서비스 로그 수정 성공:", id)

    // 감사 로그 기록
    const { logAuditEvent, compareValues } = await import("@/lib/utils/audit-logger")
    const changedFields = existingLog ? compareValues(existingLog as Record<string, unknown>, data as Record<string, unknown>) : []
    await logAuditEvent({
      action_type: "update",
      table_name: "service_logs",
      record_id: id,
      old_values: existingLog as Record<string, unknown> | undefined,
      new_values: data as Record<string, unknown>,
      changed_fields: changedFields,
      application_id: existingLog?.application_id,
      client_id: clientId,
      description: `서비스 로그 수정: ${id} (변경 필드: ${changedFields.join(", ")})`,
    })

    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${clientId}`)
    revalidatePath("/clients")
    revalidatePath(`/clients/${clientId}`)

    return { success: true, serviceLog: data }
  } catch (error) {
    console.error("[Service Log Actions] 서비스 로그 수정 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}
