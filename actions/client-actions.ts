"use server"

import { revalidatePath } from 'next/cache'
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { Database } from "@/types/database.types"
import { clerkClient } from '@clerk/nextjs/server'

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
  type: "application" | "schedule" | "service_log" | "grant_assessment" | "service_record"
  date: string
  title: string
  description: string | null
  status?: string | null
  category?: string | null
}

export interface CreatePendingClientInput {
  name: string
  birth_date?: string | null
  gender?: string | null
  contact?: string | null
  guardian_contact?: string | null
  guardian_name?: string | null
  guardian_relationship?: string | null
  email?: string | null
  disability_type?: string | null
  disability_grade?: string | null
  disability_cause?: string | null
  disability_onset_date?: string | null
  disability_description?: string | null
  secondary_disability_type?: string | null
  care_level?: string | null
  disability_progression?: string | null
  progression_cause?: string | null
  economic_status?: string | null
  city?: string | null
  address?: string | null
  housing_type?: string | null
  floor_number?: string | null
  has_elevator?: boolean | null
  obstacles?: string | null
}

export interface StaffMember {
  id: string
  fullName: string | null
  email: string | null
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

    const supabase = createAdminClient()
    const { query, disability_type, limit = 50, offset = 0 } = params

    // Only return registered clients; pending clients are managed via getPendingClients
    let queryBuilder = supabase
      .from("clients")
      .select("*", { count: "exact" })
      .eq("status", "registered")

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

    const supabase = createAdminClient()

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

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("clients")

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

    // 타입을 명시적으로 지정하여 TypeScript 타입 추론 문제 해결
    const clientDataTyped = data as Client

    // 감사 로그 기록
    const { logAuditEvent } = await import("@/lib/utils/audit-logger")
    await logAuditEvent({
      action_type: "create",
      table_name: "clients",
      record_id: clientDataTyped.id,
      new_values: clientDataTyped as Record<string, unknown>,
      client_id: clientDataTyped.id,
      description: `고객 등록: ${clientDataTyped.name}`,
    })

    return { success: true, client: clientDataTyped }
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

    const supabase = createAdminClient()

    // 기존 데이터 조회 (변경 전 값)
    const { data: oldData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()

    // 타입을 명시적으로 지정하여 TypeScript 타입 추론 문제 해결
    const oldDataTyped = oldData as Client | null

    // updated_at 자동 업데이트
    const { data, error } = await supabase
      .from("clients")

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

    // 타입을 명시적으로 지정하여 TypeScript 타입 추론 문제 해결
    const clientDataTyped = data as Client

    // 감사 로그 기록
    const { logAuditEvent, compareValues } = await import("@/lib/utils/audit-logger")
    const changedFields = oldDataTyped ? compareValues(oldDataTyped as Record<string, unknown>, clientDataTyped as Record<string, unknown>) : []
    await logAuditEvent({
      action_type: "update",
      table_name: "clients",
      record_id: clientId,
      old_values: oldDataTyped ? (oldDataTyped as Record<string, unknown>) : undefined,
      new_values: clientDataTyped as Record<string, unknown>,
      changed_fields: changedFields,
      client_id: clientId,
      description: `고객 정보 수정: ${clientDataTyped.name} (변경 필드: ${changedFields.join(", ")})`,
    })

    return { success: true, client: clientDataTyped }
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

    const supabase = createAdminClient()

    // 기존 데이터 조회 (삭제 전 값)
    const { data: oldData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()

    // 타입을 명시적으로 지정하여 TypeScript 타입 추론 문제 해결
    const oldDataTyped = oldData as Client | null

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

    // 감사 로그 기록
    const { logAuditEvent } = await import("@/lib/utils/audit-logger")
    await logAuditEvent({
      action_type: "delete",
      table_name: "clients",
      record_id: clientId,
      old_values: oldDataTyped ? (oldDataTyped as Record<string, unknown>) : undefined,
      client_id: clientId,
      description: `고객 삭제: ${oldDataTyped?.name || clientId}`,
    })

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

    const supabase = createAdminClient()

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
    const applicationIds = applications?.map((app: { id: string }) => app.id) ?? []
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

    // 4. 교부사업 평가 이력
    const { data: grantAssessments, error: grantError } = await (supabase as any)
      .from('eval_grant_assessments')
      .select('id, status, created_at, evaluation_date')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (grantError) {
      console.error("교부사업 평가 이력 조회 실패:", grantError)
    }

    // 5. 서비스 기록 이력
    const { data: serviceRecords, error: serviceRecordError } = await (supabase as any)
      .from('eval_service_records')
      .select('id, received_at, service_category, service_major_category, consultation_date, created_at')
      .eq('client_id', clientId)
      .order('received_at', { ascending: false })

    if (serviceRecordError) {
      console.error("서비스 기록 이력 조회 실패:", serviceRecordError)
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

    // 교부사업 평가 이력 추가
    const GRANT_STATUS_MAP: Record<string, string> = { draft: '작성 중', submitted: '제출 완료', completed: '완료' }
    ;(grantAssessments ?? []).forEach((r: any) => {
      history.push({
        id: r.id,
        type: 'grant_assessment',
        date: r.evaluation_date ?? r.created_at ?? '',
        title: '교부사업 적합성 평가',
        description: GRANT_STATUS_MAP[r.status] ?? r.status,
        status: r.status,
        category: 'grant_eval',
      })
    })

    // 서비스 기록 이력 추가
    ;(serviceRecords ?? []).forEach((r: any) => {
      const label = [r.service_major_category, r.service_category].filter(Boolean).join(' > ')
      history.push({
        id: r.id,
        type: 'service_record',
        date: r.consultation_date ?? r.received_at ?? r.created_at ?? '',
        title: '서비스 기록',
        description: label || null,
        status: null,
        category: r.service_major_category ?? null,
      })
    })

    // 날짜순으로 정렬 (최신순)
    history.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateB - dateA
    })

    return { success: true, history }
  } catch (error) {
    console.error("Unexpected error in getClientHistory:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function getPendingCount(): Promise<number> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return 0
    const supabase = createAdminClient()
    const { count } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
    return count ?? 0
  } catch {
    return 0
  }
}

export async function getPendingClients(): Promise<{
  success: boolean
  clients?: Client[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
    if (error) {
      console.error("getPendingClients:", error)
      return { success: false, error: "조회에 실패했습니다" }
    }
    return { success: true, clients: (data ?? []) as Client[] }
  } catch (error) {
    console.error("Unexpected error in getPendingClients:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function createPendingClient(
  input: CreatePendingClientInput
): Promise<{ success: boolean; client?: Client; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("clients")

      .insert({
        name: input.name,
        birth_date: input.birth_date ?? null,
        gender: input.gender ?? null,
        contact: input.contact ?? null,
        guardian_contact: input.guardian_contact ?? null,
        guardian_name: input.guardian_name ?? null,
        guardian_relationship: input.guardian_relationship ?? null,
        email: input.email ?? null,
        disability_type: input.disability_type ?? null,
        disability_grade: input.disability_grade ?? null,
        disability_cause: input.disability_cause ?? null,
        disability_onset_date: input.disability_onset_date ?? null,
        disability_description: input.disability_description ?? null,
        secondary_disability_type: input.secondary_disability_type ?? null,
        care_level: input.care_level ?? null,
        disability_progression: input.disability_progression ?? null,
        progression_cause: input.progression_cause ?? null,
        economic_status: input.economic_status ?? null,
        city: input.city ?? null,
        address: input.address ?? null,
        housing_type: input.housing_type ?? null,
        floor_number: input.floor_number ?? null,
        has_elevator: input.has_elevator ?? null,
        obstacles: input.obstacles ?? null,
        status: "pending",
        source: "staff",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      console.error("createPendingClient:", error)
      return { success: false, error: "등록에 실패했습니다: " + error.message }
    }
    return { success: true, client: data as Client }
  } catch (error) {
    console.error("Unexpected error in createPendingClient:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function getNextRegistrationCode(): Promise<string> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) throw new Error('권한이 없습니다')
  const supabase = createAdminClient()
  const year = new Date().getFullYear()
  const { data, error } = await supabase
    .from("clients")
    .select("registration_number")
    .like("registration_number", `GW${year}%`)
    .order("registration_number", { ascending: false })
    .limit(1)
  if (error) {
    console.error("getNextRegistrationCode:", error)
    throw new Error("등록코드 생성에 실패했습니다")
  }
  const rows = data as Array<{ registration_number: string | null }> | null
  const last = rows?.[0]?.registration_number ?? null
  const seq = last ? Number(last.slice(6)) + 1 : 1
  return `GW${year}${String(seq).padStart(4, "0")}`
}

export async function registerClient(
  clientId: string,
  assignedStaffId: string
): Promise<{ success: boolean; client?: Client; registrationNumber?: string; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }
    const supabase = createAdminClient()
    // Sequential code generation is acceptable for single-center small-team use
    const registrationNumber = await getNextRegistrationCode()
    const { data, error } = await supabase
      .from("clients")

      .update({
        status: "registered",
        registration_number: registrationNumber,
        assigned_staff_id: assignedStaffId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
      .select()
      .single()
    if (error) {
      console.error("registerClient:", error)
      return { success: false, error: "등록 처리에 실패했습니다" }
    }
    revalidatePath('/clients')
    revalidatePath('/clients/pending')
    revalidatePath(`/clients/${clientId}`)
    return { success: true, client: data as Client, registrationNumber }
  } catch (error) {
    console.error("Unexpected error in registerClient:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function getStaffMembers(): Promise<StaffMember[]> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return []
    const clerk = await clerkClient()
    const response = await clerk.users.getUserList({ limit: 200 })
    return response.data.map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.emailAddresses[0]?.emailAddress ?? null,
    }))
  } catch (error) {
    console.error("Unexpected error in getStaffMembers:", error)
    return []
  }
}

export interface ActiveService {
  id: string
  service_type: 'grant_eval' | 'rental' | 'custom_make' | 'application'
  label: string
  status: string
  status_label: string
  started_at: string
  detail_url: string
  metadata?: Record<string, string>
}

export async function getClientActiveServices(clientId: string): Promise<{
  success: boolean
  services?: ActiveService[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()

    const [grantResult, rentalResult, customResult, appResult] = await Promise.all([
      (supabase as any)
        .from('eval_grant_assessments')
        .select('id, status, created_at, referral_org')
        .eq('client_id', clientId)
        .in('status', ['draft', 'submitted']),
      (supabase as any)
        .from('rentals')
        .select('id, status, rental_start_date, inventory_id')
        .eq('client_id', clientId)
        .in('status', ['rented', 'overdue']),
      (supabase as any)
        .from('custom_makes')
        .select('id, progress_status, created_at')
        .eq('client_id', clientId)
        .not('progress_status', 'in', '("completed","cancelled")'),
      (supabase as any)
        .from('applications')
        .select('id, category, sub_category, status, created_at')
        .eq('client_id', clientId)
        .in('status', ['접수', '배정', '진행중']),
    ])

    const services: ActiveService[] = []

    const GRANT_STATUS: Record<string, string> = { draft: '작성 중', submitted: '제출 완료' }
    ;(grantResult.data ?? []).forEach((r: any) => {
      services.push({
        id: r.id,
        service_type: 'grant_eval',
        label: '교부사업 적합성 평가',
        status: r.status,
        status_label: GRANT_STATUS[r.status] ?? r.status,
        started_at: r.created_at,
        detail_url: `/grant-eval/${r.id}`,
        metadata: r.referral_org ? { referral_org: r.referral_org } : undefined,
      })
    })

    const RENTAL_STATUS: Record<string, string> = { rented: '대여 중', overdue: '연체' }
    ;(rentalResult.data ?? []).forEach((r: any) => {
      services.push({
        id: r.id,
        service_type: 'rental',
        label: '대여',
        status: r.status,
        status_label: RENTAL_STATUS[r.status] ?? r.status,
        started_at: r.rental_start_date,
        detail_url: `/rentals/${r.id}`,
      })
    })

    const CUSTOM_STATUS: Record<string, string> = {
      design: '설계', manufacturing: '제작', inspection: '검수', delivery: '납품',
    }
    ;(customResult.data ?? []).forEach((r: any) => {
      services.push({
        id: r.id,
        service_type: 'custom_make',
        label: '맞춤제작',
        status: r.progress_status,
        status_label: CUSTOM_STATUS[r.progress_status] ?? r.progress_status,
        started_at: r.created_at,
        detail_url: `/custom-makes/${r.id}`,
      })
    })

    const APP_CATEGORY: Record<string, string> = {
      consult: '상담', experience: '체험', custom: '맞춤형',
      aftercare: '사후관리', education: '교육/홍보',
    }
    ;(appResult.data ?? []).forEach((r: any) => {
      services.push({
        id: r.id,
        service_type: 'application',
        label: APP_CATEGORY[r.category] ?? r.category ?? '기타',
        status: r.status,
        status_label: r.status,
        started_at: r.created_at,
        detail_url: `/clients/${clientId}/applications/${r.id}`,
      })
    })

    services.sort((a, b) =>
      (new Date(b.started_at).getTime() || 0) - (new Date(a.started_at).getTime() || 0)
    )
    return { success: true, services }
  } catch (e) {
    console.error('getClientActiveServices:', e)
    return { success: false, error: '예상치 못한 오류가 발생했습니다' }
  }
}

export async function getActiveServiceBadgesByClientIds(
  clientIds: string[]
): Promise<{ success: boolean; data?: Record<string, ActiveService[]>; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const uniqueIds = [...new Set(clientIds)]
    if (uniqueIds.length === 0) return { success: true, data: {} }

    const supabase = createAdminClient()

    const [grantResult, rentalResult, customResult, appResult] = await Promise.all([
      (supabase as any)
        .from('eval_grant_assessments')
        .select('id, client_id, status, created_at, referral_org')
        .in('client_id', uniqueIds)
        .in('status', ['draft', 'submitted']),
      (supabase as any)
        .from('rentals')
        .select('id, client_id, status, rental_start_date')
        .in('client_id', uniqueIds)
        .in('status', ['rented', 'overdue']),
      (supabase as any)
        .from('custom_makes')
        .select('id, client_id, progress_status, created_at')
        .in('client_id', uniqueIds)
        .not('progress_status', 'in', '("completed","cancelled")'),
      (supabase as any)
        .from('applications')
        .select('id, client_id, category, status, created_at')
        .in('client_id', uniqueIds)
        .in('status', ['접수', '배정', '진행중']),
    ])

    const data: Record<string, ActiveService[]> = {}

    const add = (clientId: string, service: ActiveService) => {
      if (!data[clientId]) data[clientId] = []
      data[clientId].push(service)
    }

    const GRANT_STATUS: Record<string, string> = { draft: '작성 중', submitted: '제출 완료' }
    ;(grantResult.data ?? []).forEach((r: any) => {
      add(r.client_id, {
        id: r.id,
        service_type: 'grant_eval',
        label: '교부사업 적합성 평가',
        status: r.status,
        status_label: GRANT_STATUS[r.status] ?? r.status,
        started_at: r.created_at,
        detail_url: `/grant-eval/${r.id}`,
        metadata: r.referral_org ? { referral_org: r.referral_org } : undefined,
      })
    })

    const RENTAL_STATUS: Record<string, string> = { rented: '대여 중', overdue: '연체' }
    ;(rentalResult.data ?? []).forEach((r: any) => {
      add(r.client_id, {
        id: r.id,
        service_type: 'rental',
        label: '대여',
        status: r.status,
        status_label: RENTAL_STATUS[r.status] ?? r.status,
        started_at: r.rental_start_date,
        detail_url: `/rentals/${r.id}`,
      })
    })

    const CUSTOM_STATUS: Record<string, string> = {
      design: '설계', manufacturing: '제작', inspection: '검수', delivery: '납품',
    }
    ;(customResult.data ?? []).forEach((r: any) => {
      add(r.client_id, {
        id: r.id,
        service_type: 'custom_make',
        label: '맞춤제작',
        status: r.progress_status,
        status_label: CUSTOM_STATUS[r.progress_status] ?? r.progress_status,
        started_at: r.created_at,
        detail_url: `/custom-makes/${r.id}`,
      })
    })

    const APP_CATEGORY: Record<string, string> = {
      consult: '상담', experience: '체험', custom: '맞춤형',
      aftercare: '사후관리', education: '교육/홍보',
    }
    ;(appResult.data ?? []).forEach((r: any) => {
      add(r.client_id, {
        id: r.id,
        service_type: 'application',
        label: APP_CATEGORY[r.category] ?? r.category ?? '기타',
        status: r.status,
        status_label: r.status,
        started_at: r.created_at,
        detail_url: `/clients/${r.client_id}/applications/${r.id}`,
      })
    })

    return { success: true, data }
  } catch (e) {
    console.error('getActiveServiceBadgesByClientIds:', e)
    return { success: false, error: '예상치 못한 오류가 발생했습니다' }
  }
}

