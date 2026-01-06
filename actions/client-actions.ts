"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { Database } from "@/types/database.types"

export type Client = Database["public"]["Tables"]["clients"]["Row"]

export interface ClientWithStats extends Client {
  application_count?: number
  last_service_date?: string | null
}

export interface ClientSearchParams {
  query?: string // 이름 또는 생년월일 검색
  disability_type?: string // 장애유형 필터
  limit?: number
  offset?: number
}

export interface ClientHistoryItem {
  id: string
  type: "application" | "schedule" | "service_log"
  date: string
  title: string
  description: string | null
  status?: string | null
  category?: string | null
}

/**
 * 대상자 검색 (이름/생년월일)
 */
export async function searchClients(params: ClientSearchParams = {}): Promise<{
  success: boolean
  clients?: ClientWithStats[]
  total?: number
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()
    const { query, disability_type, limit = 50, offset = 0 } = params

    let queryBuilder = supabase
      .from("clients")
      .select("*", { count: "exact" })

    // 이름 또는 생년월일 검색
    if (query) {
      // 생년월일 형식인지 확인 (YYYY-MM-DD)
      if (query.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // 생년월일로 검색
        queryBuilder = queryBuilder.eq("birth_date", query)
      } else {
        // 이름으로 검색 (ilike는 대소문자 구분 없음)
        queryBuilder = queryBuilder.ilike("name", `%${query}%`)
      }
    }

    // 장애유형 필터
    if (disability_type) {
      queryBuilder = queryBuilder.eq("disability_type", disability_type)
    }

    // 정렬: 최근 업데이트 순
    queryBuilder = queryBuilder.order("updated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })

    // 페이지네이션
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) {
      console.error("대상자 검색 실패:", error)
      return { success: false, error: "대상자 검색에 실패했습니다" }
    }

    // 각 클라이언트의 신청서 개수 조회
    const clients: ClientWithStats[] = await Promise.all(
      (data || []).map(async (client: Client) => {
        const { count } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("client_id", client.id)

        return {
          ...client,
          application_count: count || 0,
        }
      })
    )

    return {
      success: true,
      clients,
      total: count || 0,
    }
  } catch (error) {
    console.error("Unexpected error in searchClients:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 대상자 상세 정보 조회 (ID로)
 */
export async function getClientById(clientId: string): Promise<{
  success: boolean
  client?: Client
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()

    if (error) {
      console.error("대상자 조회 실패:", error)
      return { success: false, error: "대상자 조회에 실패했습니다" }
    }

    return { success: true, client: data }
  } catch (error) {
    console.error("Unexpected error in getClientById:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 대상자 등록
 */
export async function createClientRecord(
  clientData: Omit<Client, "id" | "created_at" | "updated_at">
): Promise<{
  success: boolean
  client?: Client
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("clients")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
      .insert({
        ...clientData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("대상자 등록 실패:", error)
      return { success: false, error: "대상자 등록에 실패했습니다: " + (error.message || "알 수 없는 오류") }
    }

    return { success: true, client: data }
  } catch (error) {
    console.error("Unexpected error in createClient:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 대상자 정보 수정
 */
export async function updateClient(
  clientId: string,
  updates: Partial<Omit<Client, "id" | "created_at">>
): Promise<{
  success: boolean
  client?: Client
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // updated_at 자동 업데이트
    const { data, error } = await supabase
      .from("clients")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
      .select()
      .single()

    if (error) {
      console.error("대상자 수정 실패:", error)
      return { success: false, error: "대상자 수정에 실패했습니다" }
    }

    return { success: true, client: data }
  } catch (error) {
    console.error("Unexpected error in updateClient:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 대상자 삭제
 */
export async function deleteClient(clientId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 관련 신청서가 있는지 확인
    const { count: appCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)

    if (appCount && appCount > 0) {
      return { success: false, error: "관련 신청서가 있어 삭제할 수 없습니다" }
    }

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId)

    if (error) {
      console.error("대상자 삭제 실패:", error)
      return { success: false, error: "대상자 삭제에 실패했습니다: " + (error.message || "알 수 없는 오류") }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in deleteClient:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 대상자 서비스 이용 이력 조회 (5대 사업 통합)
 */
export async function getClientHistory(clientId: string): Promise<{
  success: boolean
  history?: ClientHistoryItem[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 1. 신청서 이력
    const { data: applications, error: appsError } = await supabase
      .from("applications")
      .select("id, status, category, sub_category, created_at, updated_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (appsError) {
      console.error("신청서 이력 조회 실패:", appsError)
    }

    // 2. 일정 이력
    const { data: schedules, error: schedulesError } = await supabase
      .from("schedules")
      .select("id, schedule_type, scheduled_date, scheduled_time, status, created_at")
      .eq("client_id", clientId)
      .order("scheduled_date", { ascending: false })
      .order("scheduled_time", { ascending: false })

    if (schedulesError) {
      console.error("일정 이력 조회 실패:", schedulesError)
    }

    // 3. 서비스 로그 이력 (applications를 통해 조회)
    // 먼저 해당 클라이언트의 applications를 조회
    const { data: clientApplications } = await supabase
      .from("applications")
      .select("id")
      .eq("client_id", clientId)

    const applicationIds = clientApplications?.map((app: { id: string }) => app.id) || []
    let serviceLogs: any[] = []

    if (applicationIds.length > 0) {
      const { data: logs, error: logsError } = await supabase
        .from("service_logs")
        .select("id, service_type, service_area, service_date, created_at")
        .in("application_id", applicationIds)
        .order("service_date", { ascending: false })

      if (logsError) {
        console.error("서비스 로그 이력 조회 실패:", logsError)
      } else {
        serviceLogs = logs || []
      }
    }

    // 모든 이력을 하나의 배열로 통합
    const history: ClientHistoryItem[] = []

    // 신청서 이력 추가
    applications?.forEach((app: { id: string; category: string | null; sub_category: string | null; status: string | null; created_at: string | null }) => {
      const categoryMap: Record<string, string> = {
        consult: "상담",
        experience: "체험",
        custom: "맞춤형",
        aftercare: "사후관리",
        education: "교육/홍보",
      }

      const subCategoryMap: Record<string, string> = {
        repair: "수리",
        rental: "대여",
        custom_make: "제작",
        visit: "방문",
        exhibition: "전시",
        cleaning: "소독/세척",
        reuse: "재사용",
      }

      const categoryName = categoryMap[app.category || ""] || app.category || "기타"
      const subCategoryName = subCategoryMap[app.sub_category || ""] || app.sub_category || ""
      const title = subCategoryName ? `${categoryName} - ${subCategoryName}` : categoryName

      history.push({
        id: app.id,
        type: "application",
        date: app.created_at || "",
        title,
        description: `상태: ${app.status || "접수"}`,
        status: app.status || null,
        category: app.category || null,
      })
    })

        // 일정 이력 추가
        schedules?.forEach((schedule: { id: string; schedule_type: string | null; scheduled_date: string | null; scheduled_time: string | null; status: string | null; created_at: string | null }) => {
          const scheduleTypeMap: Record<string, string> = {
            visit: "방문",
            consultation: "상담",
            assessment: "평가",
            delivery: "배송",
            pickup: "픽업",
          }

          const typeName = scheduleTypeMap[schedule.schedule_type || ""] || schedule.schedule_type || "일정"
          const timeStr = schedule.scheduled_time 
            ? `${schedule.scheduled_date} ${schedule.scheduled_time}` 
            : schedule.scheduled_date || ""

      history.push({
        id: schedule.id,
        type: "schedule",
        date: schedule.scheduled_date || schedule.created_at || "",
        title: typeName,
        description: timeStr,
        status: schedule.status || null,
      })
    })

    // 서비스 로그 이력 추가
    serviceLogs?.forEach((log: { id: string; service_type: string | null; service_area: string | null; service_date: string | null; created_at: string | null }) => {
      const serviceTypeMap: Record<string, string> = {
        repair: "수리",
        custom_make: "제작",
        rental: "대여",
        education: "교육",
        cleaning: "소독/세척",
      }

      const typeName = serviceTypeMap[log.service_type || ""] || log.service_type || "서비스"
      const areaName = log.service_area || ""

      history.push({
        id: log.id,
        type: "service_log",
        date: log.service_date || log.created_at || "",
        title: typeName,
        description: areaName,
      })
    })

    // 날짜순으로 정렬 (최신순)
    history.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    return { success: true, history }
  } catch (error) {
    console.error("Unexpected error in getClientHistory:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

