"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export interface ServiceHistory {
  id: string
  type: "application" | "service_log" | "rental" | "intake"
  date: string | null
  created_at: string | null
  category?: string | null
  sub_category?: string | null
  status?: string | null
  desired_date?: string | null
  service_type?: string | null
  service_date?: string | null
  item_name?: string | null
  work_description?: string | null
  rental_start_date?: string | null
  rental_end_date?: string | null
  inventory_name?: string | null
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

export interface CustomMakeStatus {
  id: string
  item_name: string
  item_description: string | null
  progress_status: string | null
  progress_percentage: number | null
  expected_completion_date: string | null
  delivery_date: string | null
  created_at: string | null
}

export interface ReuseServiceStatus {
  id: string
  item_name: string | null
  work_description: string | null
  work_result: string | null
  service_date: string | null
  created_at: string | null
}

export interface EvalServiceRecord {
  id: string
  received_at: string | null
  consultation_date: string | null
  service_major_category: string | null
  service_category: string | null
  product_name: string | null
  record_status: string | null
  satisfaction_score: number | null
  created_at: string | null
}

async function resolveClientId(userId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("portal_user_id", userId)
    .single()
  if (error || !data) return null
  return (data as { id: string }).id
}

export async function getMyServiceHistory(): Promise<{
  success: boolean
  history?: ServiceHistory[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const clientId = await resolveClientId(userId)
    if (!clientId) return { success: true, history: [] }

    const supabase = createAdminClient()
    const allHistory: ServiceHistory[] = []

    const { data: applications } = await supabase
      .from("applications")
      .select("id, category, sub_category, status, desired_date, created_at")
      .eq("client_id", clientId)

    if (applications) {
      applications.forEach((app: any) => {
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

    const applicationIds = applications?.map((app: { id: string }) => app.id) || []

    if (applicationIds.length > 0) {
      const { data: logs } = await supabase
        .from("service_logs")
        .select("id, service_type, service_date, item_name, work_description, created_at")
        .in("application_id", applicationIds)

      ;(logs || []).forEach((log: any) => {
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

      const { data: records } = await supabase
        .from("intake_records")
        .select("id, consult_date, created_at")
        .in("application_id", applicationIds)

      ;(records || []).forEach((record: any) => {
        allHistory.push({
          id: record.id,
          type: "intake",
          date: record.consult_date || record.created_at,
          created_at: record.created_at,
          consult_date: record.consult_date,
        })
      })
    }

    const { data: rentals } = await supabase
      .from("rentals")
      .select("id, rental_start_date, rental_end_date, created_at, status, inventory:inventory_id(name)")
      .eq("client_id", clientId)

    ;(rentals || []).forEach((rental: any) => {
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

    allHistory.sort((a, b) => {
      const dateA = a.date || a.created_at || ""
      const dateB = b.date || b.created_at || ""
      return dateB.localeCompare(dateA)
    })

    return { success: true, history: allHistory }
  } catch (error) {
    console.error("Unexpected error in getMyServiceHistory:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function getMyRentals(): Promise<{
  success: boolean
  rentals?: RentalStatus[]
  clientLinked?: boolean
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const clientId = await resolveClientId(userId)
    if (!clientId) return { success: true, rentals: [], clientLinked: false }

    const supabase = createAdminClient()

    const { data: rentals, error: rentalsError } = await supabase
      .from("rentals")
      .select(
        `id, inventory_id, rental_start_date, rental_end_date, return_date, status, extension_count,
         inventory:inventory_id (name, model)`
      )
      .eq("client_id", clientId)
      .eq("status", "rented")
      .order("rental_end_date", { ascending: true })

    if (rentalsError) {
      console.error("Rentals fetch error:", rentalsError)
      return { success: false, error: "대여 정보 조회에 실패했습니다" }
    }

    const formattedRentals: RentalStatus[] =
      (rentals || []).map((rental: any) => ({
        id: rental.id,
        inventory_id: rental.inventory_id,
        rental_start_date: rental.rental_start_date,
        rental_end_date: rental.rental_end_date,
        return_date: rental.return_date,
        status: rental.status,
        extension_count: rental.extension_count,
        inventory_name: rental.inventory?.name || null,
        inventory_model: rental.inventory?.model || null,
      }))

    return { success: true, rentals: formattedRentals, clientLinked: true }
  } catch (error) {
    console.error("Unexpected error in getMyRentals:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function getMyCustomMakes(): Promise<{
  success: boolean
  customMakes?: CustomMakeStatus[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const clientId = await resolveClientId(userId)
    if (!clientId) return { success: true, customMakes: [] }

    const supabase = createAdminClient()

    const { data: customMakes, error: customMakesError } = await supabase
      .from("custom_makes")
      .select("id, item_name, item_description, progress_status, progress_percentage, expected_completion_date, delivery_date, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (customMakesError) {
      console.error("Custom makes fetch error:", customMakesError)
      return { success: false, error: "맞춤제작 정보 조회에 실패했습니다" }
    }

    const formattedCustomMakes: CustomMakeStatus[] =
      (customMakes || []).map((item: any) => ({
        id: item.id,
        item_name: item.item_name,
        item_description: item.item_description,
        progress_status: item.progress_status,
        progress_percentage: item.progress_percentage,
        expected_completion_date: item.expected_completion_date,
        delivery_date: item.delivery_date,
        created_at: item.created_at,
      }))

    return { success: true, customMakes: formattedCustomMakes }
  } catch (error) {
    console.error("Unexpected error in getMyCustomMakes:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function getMyReuseServices(): Promise<{
  success: boolean
  reuseServices?: ReuseServiceStatus[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const clientId = await resolveClientId(userId)
    if (!clientId) return { success: true, reuseServices: [] }

    const supabase = createAdminClient()

    const { data: applications } = await supabase
      .from("applications")
      .select("id")
      .eq("client_id", clientId)

    const applicationIds = applications?.map((app: { id: string }) => app.id) || []
    if (applicationIds.length === 0) return { success: true, reuseServices: [] }

    const { data: reuseLogs, error: reuseLogsError } = await supabase
      .from("service_logs")
      .select("id, item_name, work_description, work_result, service_date, created_at")
      .in("application_id", applicationIds)
      .eq("service_type", "reuse")
      .order("service_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })

    if (reuseLogsError) {
      console.error("Reuse services fetch error:", reuseLogsError)
      return { success: false, error: "재사용 기기 지원 이력 조회에 실패했습니다" }
    }

    const formattedReuseServices: ReuseServiceStatus[] =
      (reuseLogs || []).map((log: any) => ({
        id: log.id,
        item_name: log.item_name,
        work_description: log.work_description,
        work_result: log.work_result,
        service_date: log.service_date,
        created_at: log.created_at,
      }))

    return { success: true, reuseServices: formattedReuseServices }
  } catch (error) {
    console.error("Unexpected error in getMyReuseServices:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function getMyEvalServiceRecords(): Promise<{
  success: boolean
  records?: EvalServiceRecord[]
  clientLinked?: boolean
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const clientId = await resolveClientId(userId)
    if (!clientId) return { success: true, records: [], clientLinked: false }

    const supabase = createAdminClient()

    const { data, error } = await (supabase as any)
      .from("eval_service_records")
      .select("id, received_at, consultation_date, service_major_category, service_category, product_name, record_status, satisfaction_score, created_at")
      .eq("client_id", clientId)
      .order("received_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("eval_service_records fetch error:", error)
      return { success: false, error: "서비스 기록 조회에 실패했습니다" }
    }

    const records: EvalServiceRecord[] = (data || []).map((r: any) => ({
      id: r.id,
      received_at: r.received_at,
      consultation_date: r.consultation_date,
      service_major_category: r.service_major_category,
      service_category: r.service_category,
      product_name: r.product_name,
      record_status: r.record_status,
      satisfaction_score: r.satisfaction_score,
      created_at: r.created_at,
    }))

    return { success: true, records, clientLinked: true }
  } catch (error) {
    console.error("Unexpected error in getMyEvalServiceRecords:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export interface ActiveApplication {
  id: string
  category: string | null
  sub_category: string | null
  status: string | null
  created_at: string | null
  desired_date: string | null
}

export async function getMyActiveApplications(): Promise<{
  success: boolean
  applications?: ActiveApplication[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const clientId = await resolveClientId(userId)
    if (!clientId) return { success: true, applications: [] }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("applications")
      .select("id, category, sub_category, status, created_at, desired_date")
      .eq("client_id", clientId)
      .not("status", "in", '("완료","취소")')
      .order("created_at", { ascending: false })

    if (error) {
      console.error("getMyActiveApplications:", error)
      return { success: false, error: "진행 중 신청 조회에 실패했습니다" }
    }

    return {
      success: true,
      applications: (data || []) as ActiveApplication[],
    }
  } catch (error) {
    console.error("Unexpected error in getMyActiveApplications:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export interface PortalIPPAAssessment {
  id: string
  assessment_year: number
  pre_date: string | null
  post_date: string | null
  items: Array<{ problem: string; pre_score: number; post_score: number | null }>
  outcome_score: number | null
  status: "pre_only" | "completed"
  notes: string | null
}

function calcPortalOutcome(
  items: Array<{ pre_score: number; post_score: number }>
): number | null {
  if (items.length === 0) return null
  const sum = items.reduce((acc, it) => acc + (it.pre_score - it.post_score), 0)
  return Math.round((sum / items.length) * 100) / 100
}

export async function getMyIPPAAssessments(): Promise<{
  success: boolean
  assessments?: PortalIPPAAssessment[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const clientId = await resolveClientId(userId)
    if (!clientId) return { success: true, assessments: [] }

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from("eval_ippa_assessments")
      .select("id, assessment_year, pre_date, post_date, items, outcome_score, status, notes")
      .eq("client_id", clientId)
      .order("assessment_year", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, assessments: (data ?? []) as PortalIPPAAssessment[] }
  } catch {
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function submitMyIPPAPostMeasurement(
  assessmentId: string,
  input: {
    post_date: string
    items: Array<{ problem: string; pre_score: number; post_score: number }>
  }
): Promise<{ success: boolean; outcomeScore?: number | null; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const clientId = await resolveClientId(userId)
    if (!clientId) return { success: false, error: "연결된 대상자 계정이 없습니다" }

    const outcomeScore = calcPortalOutcome(input.items)

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from("eval_ippa_assessments")
      .update({
        post_date: input.post_date,
        items: input.items,
        outcome_score: outcomeScore,
        status: "completed",
      })
      .eq("id", assessmentId)
      .eq("client_id", clientId)

    if (error) return { success: false, error: error.message }
    revalidatePath("/mypage")
    return { success: true, outcomeScore }
  } catch {
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function completePortalProfile(
  name: string,
  birthDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { name: name.trim(), birth_date: birthDate },
    })
    return { success: true }
  } catch (error) {
    console.error("completePortalProfile:", error)
    return { success: false, error: "프로필 저장에 실패했습니다" }
  }
}
