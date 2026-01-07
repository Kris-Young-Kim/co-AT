"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { updateInventoryStatus } from "./inventory-actions"
import { differenceInDays, isPast, isToday, addDays, format } from "date-fns"

export interface RentalItem {
  id: string
  application_id: string
  inventory_id: string
  client_id: string
  rental_start_date: string
  rental_end_date: string
  return_date: string | null
  extension_count: number | null
  status: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateRentalInput {
  application_id: string
  inventory_id: string
  client_id: string
  rental_start_date: string
  rental_end_date: string
}

export interface RentalWithDetails extends RentalItem {
  inventory_name?: string | null
  inventory_model?: string | null
  client_name?: string | null
  days_remaining?: number
  is_overdue?: boolean
  is_due_today?: boolean
}

/**
 * 대여 생성 (대여 승인)
 * - rentals 테이블에 대여 기록 생성
 * - inventory.status를 '대여중'으로 변경
 */
export async function createRental(
  input: CreateRentalInput
): Promise<{
  success: boolean
  rental?: RentalItem
  error?: string
}> {
  try {
    console.log("[Rental Actions] 대여 생성 시작:", input)

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 재고 상태 확인 (대여 가능한지 확인)
    const { data: inventory, error: inventoryError } = await supabase
      .from("inventory")
      .select("id, status, is_rental_available")
      .eq("id", input.inventory_id)
      .single()

    if (inventoryError || !inventory) {
      console.error("[Rental Actions] 재고 조회 실패:", inventoryError)
      return { success: false, error: "재고 정보를 찾을 수 없습니다" }
    }

    if (inventory.status !== "보관") {
      return {
        success: false,
        error: `해당 기기는 현재 ${inventory.status} 상태로 대여할 수 없습니다`,
      }
    }

    if (!inventory.is_rental_available) {
      return { success: false, error: "해당 기기는 대여 불가능합니다" }
    }

    // 대여 기록 생성
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .insert({
        application_id: input.application_id,
        inventory_id: input.inventory_id,
        client_id: input.client_id,
        rental_start_date: input.rental_start_date,
        rental_end_date: input.rental_end_date,
        status: "rented",
        extension_count: 0,
      })
      .select()
      .single()

    if (rentalError) {
      console.error("[Rental Actions] 대여 생성 실패:", rentalError)
      return { success: false, error: "대여 생성에 실패했습니다" }
    }

    // 재고 상태를 '대여중'으로 변경
    const statusResult = await updateInventoryStatus(input.inventory_id, "대여중")
    if (!statusResult.success) {
      console.error("[Rental Actions] 재고 상태 변경 실패:", statusResult.error)
      // 대여는 생성되었지만 상태 변경 실패 - 경고만 표시
    }

    console.log("[Rental Actions] 대여 생성 성공:", rental.id)

    // 경로 무효화
    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${input.client_id}`)
    revalidatePath("/clients")
    revalidatePath(`/clients/${input.client_id}`)
    revalidatePath("/admin/inventory")
    revalidatePath("/portal/mypage")

    return { success: true, rental }
  } catch (error) {
    console.error("[Rental Actions] 대여 생성 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 대여 반납
 * - rentals.status를 'returned'로 변경
 * - return_date 설정
 * - inventory.status를 '보관'으로 변경
 */
export async function returnRental(
  rentalId: string,
  returnDate?: string
): Promise<{
  success: boolean
  rental?: RentalItem
  error?: string
}> {
  try {
    console.log("[Rental Actions] 대여 반납 시작:", { rentalId, returnDate })

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 대여 정보 조회
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select("*")
      .eq("id", rentalId)
      .single()

    if (rentalError || !rental) {
      console.error("[Rental Actions] 대여 조회 실패:", rentalError)
      return { success: false, error: "대여 정보를 찾을 수 없습니다" }
    }

    if (rental.status === "returned") {
      return { success: false, error: "이미 반납된 대여입니다" }
    }

    // 반납일 설정 (지정되지 않으면 오늘)
    const actualReturnDate = returnDate || format(new Date(), "yyyy-MM-dd")

    // 대여 상태 업데이트
    const { data: updatedRental, error: updateError } = await supabase
      .from("rentals")
      .update({
        status: "returned",
        return_date: actualReturnDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rentalId)
      .select()
      .single()

    if (updateError) {
      console.error("[Rental Actions] 대여 반납 실패:", updateError)
      return { success: false, error: "대여 반납에 실패했습니다" }
    }

    // 재고 상태를 '보관'으로 변경
    const statusResult = await updateInventoryStatus(rental.inventory_id, "보관")
    if (!statusResult.success) {
      console.error("[Rental Actions] 재고 상태 변경 실패:", statusResult.error)
      // 반납은 완료되었지만 상태 변경 실패 - 경고만 표시
    }

    console.log("[Rental Actions] 대여 반납 성공:", rentalId)

    // 경로 무효화
    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${rental.client_id}`)
    revalidatePath("/clients")
    revalidatePath(`/clients/${rental.client_id}`)
    revalidatePath("/admin/inventory")
    revalidatePath("/portal/mypage")

    return { success: true, rental: updatedRental }
  } catch (error) {
    console.error("[Rental Actions] 대여 반납 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 대여 기간 연장
 */
export async function extendRental(
  rentalId: string,
  newEndDate: string
): Promise<{
  success: boolean
  rental?: RentalItem
  error?: string
}> {
  try {
    console.log("[Rental Actions] 대여 연장 시작:", { rentalId, newEndDate })

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 대여 정보 조회
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select("*")
      .eq("id", rentalId)
      .single()

    if (rentalError || !rental) {
      console.error("[Rental Actions] 대여 조회 실패:", rentalError)
      return { success: false, error: "대여 정보를 찾을 수 없습니다" }
    }

    if (rental.status !== "rented") {
      return { success: false, error: "대여 중인 항목만 연장할 수 있습니다" }
    }

    // 연장 횟수 증가
    const newExtensionCount = (rental.extension_count || 0) + 1

    // 대여 기간 업데이트
    const { data: updatedRental, error: updateError } = await supabase
      .from("rentals")
      .update({
        rental_end_date: newEndDate,
        extension_count: newExtensionCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rentalId)
      .select()
      .single()

    if (updateError) {
      console.error("[Rental Actions] 대여 연장 실패:", updateError)
      return { success: false, error: "대여 연장에 실패했습니다" }
    }

    console.log("[Rental Actions] 대여 연장 성공:", rentalId)

    // 경로 무효화
    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${rental.client_id}`)
    revalidatePath("/clients")
    revalidatePath(`/clients/${rental.client_id}`)
    revalidatePath("/portal/mypage")

    return { success: true, rental: updatedRental }
  } catch (error) {
    console.error("[Rental Actions] 대여 연장 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 대여 목록 조회 (관리자용)
 */
export async function getRentals(params?: {
  status?: string
  client_id?: string
  inventory_id?: string
  limit?: number
  offset?: number
}): Promise<{
  success: boolean
  rentals?: RentalWithDetails[]
  total?: number
  error?: string
}> {
  try {
    console.log("[Rental Actions] 대여 목록 조회 시작:", params)

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    let query = supabase
      .from("rentals")
      .select(
        `
        *,
        inventory:inventory_id (name, model),
        clients:client_id (name)
      `,
        { count: "exact" }
      )

    // 필터링
    if (params?.status) {
      query = query.eq("status", params.status)
    }
    if (params?.client_id) {
      query = query.eq("client_id", params.client_id)
    }
    if (params?.inventory_id) {
      query = query.eq("inventory_id", params.inventory_id)
    }

    // 정렬 (최신순)
    query = query.order("created_at", { ascending: false })

    // 페이지네이션
    const limit = params?.limit || 50
    const offset = params?.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("[Rental Actions] 대여 목록 조회 실패:", error)
      return { success: false, error: "대여 목록 조회에 실패했습니다" }
    }

    // 데이터 변환 및 D-Day 계산
    const rentals: RentalWithDetails[] =
      data?.map((rental: any) => {
        const endDate = new Date(rental.rental_end_date)
        const daysRemaining = differenceInDays(endDate, new Date())
        const isOverdue = isPast(endDate) && !isToday(endDate) && rental.status === "rented"
        const isDueToday = isToday(endDate) && rental.status === "rented"

        return {
          ...rental,
          inventory_name: rental.inventory?.name || null,
          inventory_model: rental.inventory?.model || null,
          client_name: rental.clients?.name || null,
          days_remaining: daysRemaining,
          is_overdue: isOverdue,
          is_due_today: isDueToday,
        }
      }) || []

    console.log("[Rental Actions] 대여 목록 조회 성공:", { count: rentals.length, total: count })

    return {
      success: true,
      rentals,
      total: count || 0,
    }
  } catch (error) {
    console.error("[Rental Actions] 대여 목록 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 대여 상세 조회
 */
export async function getRentalById(rentalId: string): Promise<{
  success: boolean
  rental?: RentalWithDetails
  error?: string
}> {
  try {
    console.log("[Rental Actions] 대여 상세 조회:", rentalId)

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("rentals")
      .select(
        `
        *,
        inventory:inventory_id (name, model),
        clients:client_id (name)
      `
      )
      .eq("id", rentalId)
      .single()

    if (error) {
      console.error("[Rental Actions] 대여 상세 조회 실패:", error)
      return { success: false, error: "대여 정보를 찾을 수 없습니다" }
    }

    // D-Day 계산
    const endDate = new Date(data.rental_end_date)
    const daysRemaining = differenceInDays(endDate, new Date())
    const isOverdue = isPast(endDate) && !isToday(endDate) && data.status === "rented"
    const isDueToday = isToday(endDate) && data.status === "rented"

    const rental: RentalWithDetails = {
      ...data,
      inventory_name: (data as any).inventory?.name || null,
      inventory_model: (data as any).inventory?.model || null,
      client_name: (data as any).clients?.name || null,
      days_remaining: daysRemaining,
      is_overdue: isOverdue,
      is_due_today: isDueToday,
    }

    return { success: true, rental }
  } catch (error) {
    console.error("[Rental Actions] 대여 상세 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 연체 대여 목록 조회 (알림용)
 */
export async function getOverdueRentals(): Promise<{
  success: boolean
  rentals?: RentalWithDetails[]
  error?: string
}> {
  try {
    console.log("[Rental Actions] 연체 대여 목록 조회 시작")

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 오늘 날짜
    const today = format(new Date(), "yyyy-MM-dd")

    // 연체된 대여 조회 (rental_end_date가 오늘보다 이전이고 status가 'rented')
    const { data, error } = await supabase
      .from("rentals")
      .select(
        `
        *,
        inventory:inventory_id (name, model),
        clients:client_id (name)
      `
      )
      .eq("status", "rented")
      .lt("rental_end_date", today)
      .order("rental_end_date", { ascending: true })

    if (error) {
      console.error("[Rental Actions] 연체 대여 목록 조회 실패:", error)
      return { success: false, error: "연체 대여 목록 조회에 실패했습니다" }
    }

    // 데이터 변환 및 D-Day 계산
    const rentals: RentalWithDetails[] =
      data?.map((rental: any) => {
        const endDate = new Date(rental.rental_end_date)
        const daysRemaining = differenceInDays(endDate, new Date())

        return {
          ...rental,
          inventory_name: rental.inventory?.name || null,
          inventory_model: rental.inventory?.model || null,
          client_name: rental.clients?.name || null,
          days_remaining: daysRemaining,
          is_overdue: true,
          is_due_today: false,
        }
      }) || []

    console.log("[Rental Actions] 연체 대여 목록 조회 성공:", { count: rentals.length })

    return { success: true, rentals }
  } catch (error) {
    console.error("[Rental Actions] 연체 대여 목록 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 만료 예정 대여 목록 조회 (D-Day 알림용)
 * 반납 예정일이 7일 이내인 대여 조회
 */
export async function getExpiringRentals(daysAhead: number = 7): Promise<{
  success: boolean
  rentals?: RentalWithDetails[]
  error?: string
}> {
  try {
    console.log("[Rental Actions] 만료 예정 대여 목록 조회 시작:", { daysAhead })

    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 오늘과 N일 후 날짜
    const today = format(new Date(), "yyyy-MM-dd")
    const futureDate = format(addDays(new Date(), daysAhead), "yyyy-MM-dd")

    // 만료 예정 대여 조회
    const { data, error } = await supabase
      .from("rentals")
      .select(
        `
        *,
        inventory:inventory_id (name, model),
        clients:client_id (name)
      `
      )
      .eq("status", "rented")
      .gte("rental_end_date", today)
      .lte("rental_end_date", futureDate)
      .order("rental_end_date", { ascending: true })

    if (error) {
      console.error("[Rental Actions] 만료 예정 대여 목록 조회 실패:", error)
      return { success: false, error: "만료 예정 대여 목록 조회에 실패했습니다" }
    }

    // 데이터 변환 및 D-Day 계산
    const rentals: RentalWithDetails[] =
      data?.map((rental: any) => {
        const endDate = new Date(rental.rental_end_date)
        const daysRemaining = differenceInDays(endDate, new Date())
        const isDueToday = isToday(endDate)

        return {
          ...rental,
          inventory_name: rental.inventory?.name || null,
          inventory_model: rental.inventory?.model || null,
          client_name: rental.clients?.name || null,
          days_remaining: daysRemaining,
          is_overdue: false,
          is_due_today: isDueToday,
        }
      }) || []

    console.log("[Rental Actions] 만료 예정 대여 목록 조회 성공:", { count: rentals.length })

    return { success: true, rentals }
  } catch (error) {
    console.error("[Rental Actions] 만료 예정 대여 목록 조회 중 오류:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "예상치 못한 오류가 발생했습니다",
    }
  }
}
