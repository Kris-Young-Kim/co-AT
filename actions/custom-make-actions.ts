"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { checkCustomLimit, checkCustomMakeCostLimit } from "./business-actions"

export interface CustomMakeItem {
  id: string
  application_id: string
  client_id: string
  assigned_staff_id: string | null
  item_name: string
  item_description: string | null
  specifications: string | null
  measurements: any | null
  design_files: string[] | null
  reference_images: string[] | null
  progress_status: string | null
  progress_percentage: number | null
  equipment_id: string | null
  equipment_type: string | null
  design_start_date: string | null
  manufacturing_start_date: string | null
  expected_completion_date: string | null
  actual_completion_date: string | null
  delivery_date: string | null
  cost_total: number | null
  cost_materials: number | null
  cost_labor: number | null
  cost_equipment: number | null
  cost_other: number | null
  manufacturing_notes: string | null
  inspection_notes: string | null
  delivery_notes: string | null
  result_images: string[] | null
  created_at: string | null
  updated_at: string | null
}

export interface EquipmentItem {
  id: string
  name: string
  type: string | null
  manufacturer: string | null
  model: string | null
  serial_number: string | null
  status: string | null
  specifications: any | null
  location: string | null
  manager_id: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CustomMakeProgressItem {
  id: string
  custom_make_id: string
  staff_id: string | null
  progress_status: string
  progress_percentage: number
  notes: string | null
  images: string[] | null
  created_at: string | null
}

export interface CreateCustomMakeInput {
  application_id: string
  client_id: string
  item_name: string
  item_description?: string
  specifications?: string
  measurements?: any
  design_files?: string[]
  reference_images?: string[]
  assigned_staff_id?: string
  expected_completion_date?: string
  cost_materials?: number | null
  cost_labor?: number | null
  cost_equipment?: number | null
  cost_other?: number | null
  cost_total?: number | null
}

export interface CustomMakeWithDetails extends CustomMakeItem {
  client_name?: string | null
  staff_name?: string | null
  equipment_name?: string | null
  application_status?: string | null
}

/**
 * 맞춤제작 프로젝트 생성
 */
export async function createCustomMake(
  input: CreateCustomMakeInput
): Promise<{
  success: boolean
  customMake?: CustomMakeItem
  error?: string
}> {
  try {
    console.log("[Custom Make Actions] 맞춤제작 프로젝트 생성 시작:", input)

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 맞춤제작 횟수 제한 체크
    const limitCheck = await checkCustomLimit(input.client_id)
    if (limitCheck.success && limitCheck.isExceeded) {
      console.warn("[Custom Make Actions] 맞춤제작 횟수 제한 초과:", {
        clientId: input.client_id,
        currentCount: limitCheck.currentCount,
        limit: limitCheck.limit,
      })
      return {
        success: false,
        error: `맞춤제작 연간 제한(2회)을 초과했습니다. 현재 ${limitCheck.currentCount}회 사용 중입니다.`,
      }
    }

    // 맞춤제작비(재료비) 한도 체크 (재료비가 있는 경우)
    if (input.cost_materials && input.cost_materials > 0) {
      const costLimitCheck = await checkCustomMakeCostLimit(
        input.client_id,
        input.cost_materials
      )
      if (costLimitCheck.success && costLimitCheck.isExceeded) {
        console.warn("[Custom Make Actions] 맞춤제작비 한도 초과:", {
          clientId: input.client_id,
          currentTotal: costLimitCheck.currentTotal,
          newAmount: input.cost_materials,
          newTotal: costLimitCheck.newTotal,
          limit: costLimitCheck.limit,
        })
        return {
          success: false,
          error: `맞춤제작비(재료비) 연간 한도(10만원)를 초과했습니다. 현재 누적: ${costLimitCheck.currentTotal?.toLocaleString()}원, 신규: ${input.cost_materials.toLocaleString()}원, 합계: ${costLimitCheck.newTotal?.toLocaleString()}원입니다. 초과분은 자부담입니다.`,
        }
      }
    }

    // 맞춤제작 프로젝트 생성
    const { data, error } = await supabase
      .from("custom_makes")
      .insert({
        application_id: input.application_id,
        client_id: input.client_id,
        item_name: input.item_name,
        item_description: input.item_description || null,
        specifications: input.specifications || null,
        measurements: input.measurements || null,
        design_files: input.design_files || null,
        reference_images: input.reference_images || null,
        assigned_staff_id: input.assigned_staff_id || null,
        expected_completion_date: input.expected_completion_date || null,
        cost_materials: input.cost_materials || null,
        cost_total: input.cost_total || null,
        progress_status: "design",
        progress_percentage: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[Custom Make Actions] 맞춤제작 프로젝트 생성 실패:", error)
      return { success: false, error: "맞춤제작 프로젝트 생성에 실패했습니다" }
    }

    // 초기 진행도 이력 생성
    await supabase.from("custom_make_progress").insert({
      custom_make_id: data.id,
      progress_status: "design",
      progress_percentage: 0,
      notes: "맞춤제작 프로젝트 생성",
    })

    console.log("[Custom Make Actions] 맞춤제작 프로젝트 생성 성공:", data.id)

    revalidatePath("/admin/custom-makes")
    revalidatePath(`/admin/clients/${input.client_id}`)
    revalidatePath("/clients")
    revalidatePath(`/clients/${input.client_id}`)

    return { success: true, customMake: data }
  } catch (error) {
    console.error("[Custom Make Actions] 맞춤제작 프로젝트 생성 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 맞춤제작 진행도 업데이트
 */
export async function updateCustomMakeProgress(
  customMakeId: string,
  progress: {
    progress_status?: string
    progress_percentage?: number
    notes?: string
    images?: string[]
    manufacturing_start_date?: string
    actual_completion_date?: string
    delivery_date?: string
  }
): Promise<{
  success: boolean
  customMake?: CustomMakeItem
  error?: string
}> {
  try {
    console.log("[Custom Make Actions] 진행도 업데이트:", { customMakeId, progress })

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다" }
    }

    const supabase = await createClient()

    // 프로필 ID 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single()

    const staffId = profile ? (profile as { id: string }).id : null

    // 맞춤제작 정보 업데이트
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (progress.progress_status) updateData.progress_status = progress.progress_status
    if (progress.progress_percentage !== undefined)
      updateData.progress_percentage = progress.progress_percentage
    if (progress.manufacturing_start_date)
      updateData.manufacturing_start_date = progress.manufacturing_start_date
    if (progress.actual_completion_date)
      updateData.actual_completion_date = progress.actual_completion_date
    if (progress.delivery_date) updateData.delivery_date = progress.delivery_date

    const { data: updatedCustomMake, error: updateError } = await supabase
      .from("custom_makes")
      .update(updateData)
      .eq("id", customMakeId)
      .select()
      .single()

    if (updateError) {
      console.error("[Custom Make Actions] 진행도 업데이트 실패:", updateError)
      return { success: false, error: "진행도 업데이트에 실패했습니다" }
    }

    // 진행도 이력 추가
    if (progress.progress_status || progress.progress_percentage !== undefined) {
      await supabase.from("custom_make_progress").insert({
        custom_make_id: customMakeId,
        staff_id: staffId,
        progress_status: progress.progress_status || updatedCustomMake.progress_status,
        progress_percentage:
          progress.progress_percentage !== undefined
            ? progress.progress_percentage
            : updatedCustomMake.progress_percentage || 0,
        notes: progress.notes || null,
        images: progress.images || null,
      })
    }

    console.log("[Custom Make Actions] 진행도 업데이트 성공:", customMakeId)

    revalidatePath("/admin/custom-makes")
    revalidatePath(`/admin/custom-makes/${customMakeId}`)

    return { success: true, customMake: updatedCustomMake }
  } catch (error) {
    console.error("[Custom Make Actions] 진행도 업데이트 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 장비 배정
 */
export async function assignEquipment(
  customMakeId: string,
  equipmentId: string
): Promise<{
  success: boolean
  customMake?: CustomMakeItem
  error?: string
}> {
  try {
    console.log("[Custom Make Actions] 장비 배정:", { customMakeId, equipmentId })

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 장비 정보 조회
    const { data: equipment, error: equipmentError } = await supabase
      .from("equipment")
      .select("id, type, status")
      .eq("id", equipmentId)
      .single()

    if (equipmentError || !equipment) {
      return { success: false, error: "장비 정보를 찾을 수 없습니다" }
    }

    if (equipment.status !== "available" && equipment.status !== "reserved") {
      return { success: false, error: "해당 장비는 현재 사용할 수 없습니다" }
    }

    // 장비 배정 및 상태 변경
    const { data: updatedCustomMake, error: updateError } = await supabase
      .from("custom_makes")
      .update({
        equipment_id: equipmentId,
        equipment_type: equipment.type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customMakeId)
      .select()
      .single()

    if (updateError) {
      console.error("[Custom Make Actions] 장비 배정 실패:", updateError)
      return { success: false, error: "장비 배정에 실패했습니다" }
    }

    // 장비 상태를 '사용중'으로 변경
    await supabase
      .from("equipment")
      .update({ status: "in_use", updated_at: new Date().toISOString() })
      .eq("id", equipmentId)

    console.log("[Custom Make Actions] 장비 배정 성공:", customMakeId)

    revalidatePath("/admin/custom-makes")
    revalidatePath(`/admin/custom-makes/${customMakeId}`)

    return { success: true, customMake: updatedCustomMake }
  } catch (error) {
    console.error("[Custom Make Actions] 장비 배정 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 맞춤제작 목록 조회
 */
export async function getCustomMakes(params?: {
  progress_status?: string
  client_id?: string
  assigned_staff_id?: string
  limit?: number
  offset?: number
}): Promise<{
  success: boolean
  customMakes?: CustomMakeWithDetails[]
  total?: number
  error?: string
}> {
  try {
    console.log("[Custom Make Actions] 맞춤제작 목록 조회:", params)

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    let query = supabase
      .from("custom_makes")
      .select(
        `
        *,
        clients:client_id (name),
        profiles:assigned_staff_id (full_name),
        equipment:equipment_id (name),
        applications:application_id (status)
      `,
        { count: "exact" }
      )

    // 필터링
    if (params?.progress_status) {
      query = query.eq("progress_status", params.progress_status)
    }
    if (params?.client_id) {
      query = query.eq("client_id", params.client_id)
    }
    if (params?.assigned_staff_id) {
      query = query.eq("assigned_staff_id", params.assigned_staff_id)
    }

    // 정렬 (최신순)
    query = query.order("created_at", { ascending: false })

    // 페이지네이션
    const limit = params?.limit || 50
    const offset = params?.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("[Custom Make Actions] 맞춤제작 목록 조회 실패:", error)
      return { success: false, error: "맞춤제작 목록 조회에 실패했습니다" }
    }

    // 데이터 변환
    const customMakes: CustomMakeWithDetails[] =
      data?.map((item: any) => ({
        ...item,
        client_name: item.clients?.name || null,
        staff_name: item.profiles?.full_name || null,
        equipment_name: item.equipment?.name || null,
        application_status: item.applications?.status || null,
      })) || []

    console.log("[Custom Make Actions] 맞춤제작 목록 조회 성공:", {
      count: customMakes.length,
      total: count,
    })

    return {
      success: true,
      customMakes,
      total: count || 0,
    }
  } catch (error) {
    console.error("[Custom Make Actions] 맞춤제작 목록 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 맞춤제작 상세 조회
 */
export async function getCustomMakeById(customMakeId: string): Promise<{
  success: boolean
  customMake?: CustomMakeWithDetails
  progressHistory?: CustomMakeProgressItem[]
  error?: string
}> {
  try {
    console.log("[Custom Make Actions] 맞춤제작 상세 조회:", customMakeId)

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 맞춤제작 정보 조회
    const { data, error } = await supabase
      .from("custom_makes")
      .select(
        `
        *,
        clients:client_id (name),
        profiles:assigned_staff_id (full_name),
        equipment:equipment_id (name, type, status),
        applications:application_id (status)
      `
      )
      .eq("id", customMakeId)
      .single()

    if (error) {
      console.error("[Custom Make Actions] 맞춤제작 상세 조회 실패:", error)
      return { success: false, error: "맞춤제작 정보를 찾을 수 없습니다" }
    }

    // 진행도 이력 조회
    const { data: progressHistory, error: progressError } = await supabase
      .from("custom_make_progress")
      .select("*")
      .eq("custom_make_id", customMakeId)
      .order("created_at", { ascending: false })

    if (progressError) {
      console.error("[Custom Make Actions] 진행도 이력 조회 실패:", progressError)
    }

    const customMake: CustomMakeWithDetails = {
      ...data,
      client_name: (data as any).clients?.name || null,
      staff_name: (data as any).profiles?.full_name || null,
      equipment_name: (data as any).equipment?.name || null,
      application_status: (data as any).applications?.status || null,
    }

    return {
      success: true,
      customMake,
      progressHistory: progressHistory || [],
    }
  } catch (error) {
    console.error("[Custom Make Actions] 맞춤제작 상세 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 장비 목록 조회
 */
export async function getEquipment(params?: {
  type?: string
  status?: string
  limit?: number
}): Promise<{
  success: boolean
  equipment?: EquipmentItem[]
  error?: string
}> {
  try {
    console.log("[Custom Make Actions] 장비 목록 조회:", params)

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    let query = supabase.from("equipment").select("*")

    // 필터링
    if (params?.type) {
      query = query.eq("type", params.type)
    }
    if (params?.status) {
      query = query.eq("status", params.status)
    }

    // 정렬
    query = query.order("name", { ascending: true })

    // 페이지네이션
    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Custom Make Actions] 장비 목록 조회 실패:", error)
      return { success: false, error: "장비 목록 조회에 실패했습니다" }
    }

    return {
      success: true,
      equipment: data || [],
    }
  } catch (error) {
    console.error("[Custom Make Actions] 장비 목록 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}
