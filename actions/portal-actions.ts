"use server"

import { createClient } from "@/lib/supabase/server"
import { auth } from "@clerk/nextjs/server"

export interface ServiceHistory {
  id: string
  type: "application" | "service_log" | "rental" | "intake"
  // 공통 필드
  date: string | null // 서비스 제공일 또는 신청일
  created_at: string | null
  // Application 관련
  category?: string | null
  sub_category?: string | null
  status?: string | null
  desired_date?: string | null
  // Service Log 관련
  service_type?: string | null // repair, custom_make, cleaning, reuse, inspection 등
  service_date?: string | null
  item_name?: string | null
  work_description?: string | null
  // Rental 관련
  rental_start_date?: string | null
  rental_end_date?: string | null
  inventory_name?: string | null
  // Intake 관련
  consult_date?: string | null
}

export interface RentalStatus {
  id: string
  inventory_id: string
  rental_start_date: string
  rental_end_date: string
  return_date: string | null
  status: string | null
  extension_count: number | null
  inventory_name: string | null
  inventory_model: string | null
}

/**
 * 현재 로그인한 사용자의 통합 서비스 이력 조회
 * (신청, 상담, 맞춤제작, 재사용지원, 수리및점검, 소독및세척, 대여 포함)
 */
export async function getMyServiceHistory(): Promise<{
  success: boolean
  history?: ServiceHistory[]
  error?: string
}> {
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

    // 클라이언트 정보 조회
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", (profile as { id: string }).id)
      .single()

    if (clientError || !client) {
      return { success: true, history: [] }
    }

    const clientId = (client as { id: string }).id
    const allHistory: ServiceHistory[] = []

    // 1. 신청 이력 (applications)
    const { data: applications } = await supabase
      .from("applications")
      .select("id, category, sub_category, status, desired_date, created_at")
      .eq("client_id", clientId)

    if (applications) {
      applications.forEach((app: { id: string; desired_date: string | null; created_at: string | null; category: string | null; sub_category: string | null; status: string | null }) => {
        allHistory.push({
          id: app.id,
          type: "application",
          date: app.desired_date || app.created_at || "",
          created_at: app.created_at || "",
          category: app.category,
          sub_category: app.sub_category,
          status: app.status,
          desired_date: app.desired_date,
        })
      })
    }

    // 2. 서비스 로그 (service_logs) - 수리, 맞춤제작, 소독, 재사용, 점검 등
    // 먼저 해당 클라이언트의 applications를 조회
    const { data: clientApplications } = await supabase
      .from("applications")
      .select("id")
      .eq("client_id", clientId)

    const applicationIds = clientApplications?.map((app: { id: string }) => app.id) || []

    let serviceLogs: any[] = []
    if (applicationIds.length > 0) {
      const { data: logs } = await supabase
        .from("service_logs")
        .select("id, service_type, service_date, item_name, work_description, created_at, application_id")
        .in("application_id", applicationIds)

      serviceLogs = logs || []
    }

    if (serviceLogs) {
      serviceLogs.forEach((log: any) => {
        allHistory.push({
          id: log.id,
          type: "service_log",
          date: log.service_date || log.created_at,
          created_at: log.created_at,
          service_type: log.service_type,
          service_date: log.service_date,
          item_name: log.item_name,
          work_description: log.work_description,
        })
      })
    }

    // 3. 상담 기록 (intake_records)
    let intakeRecords: any[] = []
    if (applicationIds.length > 0) {
      const { data: records } = await supabase
        .from("intake_records")
        .select("id, consult_date, created_at, application_id")
        .in("application_id", applicationIds)

      intakeRecords = records || []
    }

    if (intakeRecords) {
      intakeRecords.forEach((record: any) => {
        allHistory.push({
          id: record.id,
          type: "intake",
          date: record.consult_date || record.created_at,
          created_at: record.created_at,
          consult_date: record.consult_date,
        })
      })
    }

    // 4. 대여 이력 (rentals) - 대여 중인 것만이 아니라 모든 대여 이력
    const { data: rentals } = await supabase
      .from("rentals")
      .select(
        `
        id,
        rental_start_date,
        rental_end_date,
        created_at,
        status,
        inventory_id,
        inventory:inventory_id(name)
      `
      )
      .eq("client_id", clientId)

    if (rentals) {
      rentals.forEach((rental: any) => {
        allHistory.push({
          id: rental.id,
          type: "rental",
          date: rental.rental_start_date || rental.created_at,
          created_at: rental.created_at,
          rental_start_date: rental.rental_start_date,
          rental_end_date: rental.rental_end_date,
          inventory_name: rental.inventory?.name || null,
          status: rental.status,
        })
      })
    }

    // 날짜순으로 정렬 (최신순)
    allHistory.sort((a, b) => {
      const dateA = a.date || a.created_at || ""
      const dateB = b.date || b.created_at || ""
      return dateB.localeCompare(dateA)
    })

    return {
      success: true,
      history: allHistory,
    }
  } catch (error) {
    console.error("Unexpected error in getMyServiceHistory:", error)
    return {
      success: false,
      error: "예상치 못한 오류가 발생했습니다",
    }
  }
}

/**
 * 현재 로그인한 사용자의 대여 중인 기기 조회
 */
export async function getMyRentals(): Promise<{
  success: boolean
  rentals?: RentalStatus[]
  error?: string
}> {
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

    // 클라이언트 정보 조회
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", (profile as { id: string }).id)
      .single()

    if (clientError || !client) {
      // 클라이언트가 없으면 빈 배열 반환
      return { success: true, rentals: [] }
    }

    // 대여 중인 기기 조회 (status가 'rented'인 것만)
    const { data: rentals, error: rentalsError } = await supabase
      .from("rentals")
      .select(
        `
        id,
        inventory_id,
        rental_start_date,
        rental_end_date,
        return_date,
        status,
        extension_count,
        inventory:inventory_id (
          name,
          model
        )
      `
      )
      .eq("client_id", (client as { id: string }).id)
      .eq("status", "rented")
      .order("rental_end_date", { ascending: true })

    if (rentalsError) {
      console.error("Rentals fetch error:", rentalsError)
      return { success: false, error: "대여 정보 조회에 실패했습니다" }
    }

    // 데이터 변환
    const formattedRentals: RentalStatus[] =
      rentals?.map((rental: any) => ({
        id: rental.id,
        inventory_id: rental.inventory_id,
        rental_start_date: rental.rental_start_date,
        rental_end_date: rental.rental_end_date,
        return_date: rental.return_date,
        status: rental.status,
        extension_count: rental.extension_count,
        inventory_name: rental.inventory?.name || null,
        inventory_model: rental.inventory?.model || null,
      })) || []

    return {
      success: true,
      rentals: formattedRentals,
    }
  } catch (error) {
    console.error("Unexpected error in getMyRentals:", error)
    return {
      success: false,
      error: "예상치 못한 오류가 발생했습니다",
    }
  }
}

