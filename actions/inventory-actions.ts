"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

export interface ReusableDevice {
  id: string
  name: string
  category: string | null
  asset_code: string | null
  manufacturer: string | null
  model: string | null
  purchase_date: string | null
  status: string
  is_rental_available: boolean
}

export interface InventoryItem {
  id: string
  name: string
  asset_code: string | null
  category: string | null
  status: string | null
  is_rental_available: boolean | null
  manufacturer: string | null
  model: string | null
  purchase_date: string | null
  purchase_price: number | null
  qr_code: string | null
  image_url: string | null
  created_at: string | null
  updated_at: string | null
}

export interface InventoryListParams {
  search?: string
  status?: string
  category?: string
  is_rental_available?: boolean
  limit?: number
  offset?: number
}

export interface InventoryListResult {
  success: boolean
  items?: InventoryItem[]
  total?: number
  error?: string
}

/**
 * 재사용(기증) 가능한 기기 목록 조회
 * inventory 테이블에서 status가 '보관'이고 is_rental_available이 true인 기기들 조회
 */
export async function getReusableDevices(limit: number = 20): Promise<ReusableDevice[]> {
  // 공개 페이지이므로 RLS를 우회하여 조회
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("inventory")
    .select("id, name, category, asset_code, manufacturer, model, purchase_date, status, is_rental_available")
    .eq("status", "보관")
    .eq("is_rental_available", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[Inventory Actions] 재사용 기기 조회 실패:", error)
    return []
  }

  return data || []
}

/**
 * 공개 페이지용 재고 목록 조회 (필터링, 상태별 조회 지원)
 */
export async function getPublicInventoryList(params?: {
  status?: string
  is_rental_available?: boolean
  category?: string
  limit?: number
}): Promise<InventoryItem[]> {
  try {
    // 공개 페이지이므로 RLS를 우회하여 조회
    const supabase = createAdminClient()

    let query = supabase.from("inventory").select("*")

    // 상태 필터
    if (params?.status) {
      query = query.eq("status", params.status)
    }

    // 대여 가능 여부 필터
    if (params?.is_rental_available !== undefined) {
      query = query.eq("is_rental_available", params.is_rental_available)
    }

    // 카테고리 필터
    if (params?.category) {
      query = query.eq("category", params.category)
    }

    // 정렬 (최신순)
    query = query.order("created_at", { ascending: false })

    // 제한
    const limit = params?.limit || 100
    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      console.error("[Inventory Actions] 공개 재고 목록 조회 실패:", error)
      return []
    }

    return (data || []) as InventoryItem[]
  } catch (error) {
    console.error("[Inventory Actions] 공개 재고 목록 조회 중 오류:", error)
    return []
  }
}

/**
 * 재고 목록 조회 (필터링, 검색, 페이지네이션 지원)
 */
export async function getInventoryList(
  params: InventoryListParams
): Promise<InventoryListResult> {
  try {
    console.log("[Inventory Actions] 재고 목록 조회 시작:", params)

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      console.error("[Inventory Actions] 권한 없음")
      return { success: false, error: "권한이 없습니다" }
    }

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    let query = supabase.from("inventory").select("*", { count: "exact" })

    // 검색 (기기명, 자산번호, 제조사, 모델명)
    if (params.search) {
      query = query.or(
        `name.ilike.%${params.search}%,asset_code.ilike.%${params.search}%,manufacturer.ilike.%${params.search}%,model.ilike.%${params.search}%`
      )
    }

    // 상태 필터
    if (params.status) {
      query = query.eq("status", params.status)
    }

    // 카테고리 필터
    if (params.category) {
      query = query.eq("category", params.category)
    }

    // 대여 가능 여부 필터
    if (params.is_rental_available !== undefined) {
      query = query.eq("is_rental_available", params.is_rental_available)
    }

    // 정렬 (최신순)
    query = query.order("created_at", { ascending: false })

    // 페이지네이션
    const limit = params.limit || 50
    const offset = params.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("[Inventory Actions] 재고 목록 조회 실패:", error)
      return { success: false, error: "재고 목록 조회에 실패했습니다" }
    }

    console.log("[Inventory Actions] 재고 목록 조회 성공:", { count: data?.length, total: count })

    return {
      success: true,
      items: data || [],
      total: count || 0,
    }
  } catch (error) {
    console.error("[Inventory Actions] 재고 목록 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 재고 상세 조회
 */
export async function getInventoryItem(id: string): Promise<{
  success: boolean
  item?: InventoryItem
  error?: string
}> {
  try {
    console.log("[Inventory Actions] 재고 상세 조회:", id)

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("[Inventory Actions] 재고 상세 조회 실패:", error)
      return { success: false, error: "재고 정보를 찾을 수 없습니다" }
    }

    return { success: true, item: data }
  } catch (error) {
    console.error("[Inventory Actions] 재고 상세 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 재고 등록
 */
export async function createInventoryItem(
  data: Omit<InventoryItem, "id" | "created_at" | "updated_at">
): Promise<{
  success: boolean
  item?: InventoryItem
  error?: string
}> {
  try {
    console.log("[Inventory Actions] 재고 등록 시작:", data)

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    const { data: newItem, error } = await supabase
      .from("inventory")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16): TableInsert 타입이 insert 메서드와 완전히 호환되지 않음
      .insert({
        name: data.name,
        asset_code: data.asset_code || null,
        category: data.category || null,
        status: data.status || "보관",
        is_rental_available: data.is_rental_available ?? true,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        purchase_date: data.purchase_date || null,
        purchase_price: data.purchase_price || null,
        qr_code: data.qr_code || null,
        image_url: data.image_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[Inventory Actions] 재고 등록 실패:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        data,
      })
      return { 
        success: false, 
        error: `재고 등록에 실패했습니다: ${error.message || error.code || "알 수 없는 오류"}` 
      }
    }

    // 타입 캐스팅
    const newItemTyped = newItem as InventoryItem | null;
    console.log("[Inventory Actions] 재고 등록 성공:", newItemTyped?.id);

    return { success: true, item: newItemTyped || undefined }
  } catch (error) {
    console.error("[Inventory Actions] 재고 등록 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 재고 수정
 */
export async function updateInventoryItem(
  id: string,
  data: Partial<Omit<InventoryItem, "id" | "created_at" | "updated_at">>
): Promise<{
  success: boolean
  item?: InventoryItem
  error?: string
}> {
  try {
    console.log("[Inventory Actions] 재고 수정 시작:", { id, data })

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    const { data: updatedItem, error } = await supabase
      .from("inventory")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16): TableUpdate 타입이 update 메서드와 완전히 호환되지 않음
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Inventory Actions] 재고 수정 실패:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        id,
        data,
      })
      return { 
        success: false, 
        error: `재고 수정에 실패했습니다: ${error.message || error.code || "알 수 없는 오류"}` 
      }
    }

    console.log("[Inventory Actions] 재고 수정 성공:", id)

    return { success: true, item: updatedItem }
  } catch (error) {
    console.error("[Inventory Actions] 재고 수정 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 재고 삭제
 */
export async function deleteInventoryItem(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    console.log("[Inventory Actions] 재고 삭제 시작:", id)

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    const { error } = await supabase.from("inventory").delete().eq("id", id)

    if (error) {
      console.error("[Inventory Actions] 재고 삭제 실패:", error)
      return { success: false, error: "재고 삭제에 실패했습니다" }
    }

    console.log("[Inventory Actions] 재고 삭제 성공:", id)

    return { success: true }
  } catch (error) {
    console.error("[Inventory Actions] 재고 삭제 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 재고 상태 변경 (불출 관리)
 */
export async function updateInventoryStatus(
  id: string,
  status: string
): Promise<{
  success: boolean
  item?: InventoryItem
  error?: string
}> {
  try {
    console.log("[Inventory Actions] 재고 상태 변경:", { id, status })

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    const { data: updatedItem, error } = await supabase
      .from("inventory")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16): TableUpdate 타입이 update 메서드와 완전히 호환되지 않음
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Inventory Actions] 재고 상태 변경 실패:", error)
      return { success: false, error: "재고 상태 변경에 실패했습니다" }
    }

    console.log("[Inventory Actions] 재고 상태 변경 성공:", { id, status })

    return { success: true, item: updatedItem }
  } catch (error) {
    console.error("[Inventory Actions] 재고 상태 변경 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * QR 코드로 재고 조회
 */
export async function getInventoryByQRCode(qrCode: string): Promise<{
  success: boolean
  item?: InventoryItem
  error?: string
}> {
  try {
    console.log("[Inventory Actions] QR 코드로 재고 조회:", qrCode)

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("qr_code", qrCode)
      .single()

    if (error) {
      console.error("[Inventory Actions] QR 코드로 재고 조회 실패:", error)
      return { success: false, error: "QR 코드에 해당하는 재고를 찾을 수 없습니다" }
    }

    return { success: true, item: data }
  } catch (error) {
    console.error("[Inventory Actions] QR 코드로 재고 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}
