"use server"

import { revalidatePath } from 'next/cache'
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { Database } from "@/types/database.types"
import { clerkClient } from '@clerk/nextjs/server'

export type Client = Database["public"]["Tables"]["clients"]["Row"]

export interface ClientTag {
  id: string
  client_id: string
  tag: string
  created_by: string
  created_at: string
}

export interface ClientWithStats extends Client {
  application_count?: number
  last_service_date?: string | null
  tags?: string[]
}

export interface ClientSearchParams {
  query?: string
  disability_type?: string
  lifecycle_status?: string
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
    const { query, disability_type, lifecycle_status, limit = 50, offset = 0 } = params

    // Only return registered clients; pending clients are managed via getPendingClients
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let queryBuilder = (supabase as any)
      .from("clients")
      .select("*", { count: "exact" })
      .eq("status", "registered")

    if (query) {
      if (query.match(/^\d{4}-\d{2}-\d{2}$/)) {
        queryBuilder = queryBuilder.eq("birth_date", query)
      } else {
        queryBuilder = queryBuilder.ilike("name", `%${query}%`)
      }
    }

    if (disability_type) {
      queryBuilder = queryBuilder.eq("disability_type", disability_type)
    }

    if (lifecycle_status) {
      queryBuilder = queryBuilder.eq("lifecycle_status", lifecycle_status)
    }

    queryBuilder = queryBuilder
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })

    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) {
      console.error("대상자 검색 실패:", error)
      return { success: false, error: "대상자 검색에 실패했습니다" }
    }

    const clientList = (data || []) as Client[]
    const clientIds = clientList.map((c) => c.id)

    // Batch fetch application counts and tags in parallel
    const [appCounts, tagsResult] = await Promise.all([
      Promise.all(
        clientIds.map(async (id) => {
          const { count: c } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("client_id", id)
          return { id, count: c || 0 }
        })
      ),
      (supabase as any)
        .from("client_tags")
        .select("client_id, tag")
        .in("client_id", clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000']),
    ])

    const appCountMap: Record<string, number> = {}
    for (const { id, count: c } of appCounts) appCountMap[id] = c

    const tagMap: Record<string, string[]> = {}
    for (const row of (tagsResult.data ?? []) as { client_id: string; tag: string }[]) {
      if (!tagMap[row.client_id]) tagMap[row.client_id] = []
      tagMap[row.client_id].push(row.tag)
    }

    const clients: ClientWithStats[] = clientList.map((client) => ({
      ...client,
      application_count: appCountMap[client.id] ?? 0,
      tags: tagMap[client.id] ?? [],
    }))

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
  clientData: Omit<Client, "id" | "created_at" | "updated_at" | "qr_token" | "portal_user_id">
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

export interface PortalUserInfo {
  id: string
  email: string | null
  fullName: string | null
}

export async function getLinkedPortalUserInfo(portalUserId: string): Promise<{
  success: boolean
  user?: PortalUserInfo
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(portalUserId)
    return {
      success: true,
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? null,
        fullName: user.fullName,
      },
    }
  } catch (error) {
    console.error('getLinkedPortalUserInfo:', error)
    return { success: false, error: '포털 사용자 정보를 가져오지 못했습니다' }
  }
}

function normalizeKoreanPhone(value: string): string {
  // Strip spaces, dashes, dots
  const digits = value.replace(/[\s\-\.]/g, '')
  if (digits.startsWith('+82')) return digits
  // 010... → +8210...
  if (digits.startsWith('0')) return '+82' + digits.slice(1)
  return '+82' + digits
}

export async function linkPortalUser(
  clientId: string,
  identifier: string,
  mode: 'email' | 'phone' = 'email'
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const clerk = await clerkClient()

    let clerkUser
    if (mode === 'phone') {
      const e164 = normalizeKoreanPhone(identifier)
      const result = await clerk.users.getUserList({ phoneNumber: [e164], limit: 1 })
      clerkUser = result.data[0]
      if (!clerkUser) {
        return { success: false, error: '해당 전화번호로 가입된 포털 계정을 찾을 수 없습니다' }
      }
    } else {
      const result = await clerk.users.getUserList({ emailAddress: [identifier.trim()], limit: 1 })
      clerkUser = result.data[0]
      if (!clerkUser) {
        return { success: false, error: '해당 이메일로 가입된 포털 계정을 찾을 수 없습니다' }
      }
    }

    const supabase = createAdminClient()

    // Check if this Clerk user is already linked to another client
    const { data: existing } = await supabase
      .from('clients')
      .select('id, name')
      .eq('portal_user_id', clerkUser.id)
      .neq('id', clientId)
      .single()

    if (existing) {
      const row = existing as { id: string; name: string }
      return { success: false, error: `이미 다른 대상자(${row.name})에 연결된 계정입니다` }
    }

    const { error } = await supabase
      .from('clients')
      .update({ portal_user_id: clerkUser.id, updated_at: new Date().toISOString() })
      .eq('id', clientId)

    if (error) {
      console.error('linkPortalUser update:', error)
      return { success: false, error: '연결에 실패했습니다' }
    }

    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in linkPortalUser:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다' }
  }
}

export async function getClientByQrToken(qrToken: string): Promise<{
  success: boolean
  client?: Client
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('qr_token' as any, qrToken)
      .single()
    if (error || !data) return { success: false, error: '대상자 QR을 찾을 수 없습니다' }
    return { success: true, client: data as Client }
  } catch {
    return { success: false, error: '오류가 발생했습니다' }
  }
}

export async function getAllClientsForLabels(): Promise<{
  success: boolean
  clients?: Array<{ id: string; name: string; birth_date: string | null; registration_number: string | null; qr_token: string }>
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, birth_date, registration_number, qr_token')
      .eq('status', 'registered')
      .order('name', { ascending: true })
    if (error) return { success: false, error: '조회에 실패했습니다' }
    return { success: true, clients: (data ?? []) as any }
  } catch {
    return { success: false, error: '오류가 발생했습니다' }
  }
}

export async function linkPortalUserByName(
  clientId: string,
  name: string,
  birthDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const clerk = await clerkClient()
    const result = await clerk.users.getUserList({ query: name.trim(), limit: 50 })

    const matched = result.data.filter((u) => {
      const meta = u.publicMetadata as { birth_date?: string; name?: string }
      return meta?.birth_date === birthDate
    })

    if (matched.length === 0) {
      return { success: false, error: '이름과 생년월일이 일치하는 포털 계정을 찾을 수 없습니다' }
    }
    if (matched.length > 1) {
      return { success: false, error: '일치하는 계정이 여러 명입니다. 이메일 또는 전화번호로 검색해 주세요' }
    }

    const clerkUser = matched[0]
    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('clients')
      .select('id, name')
      .eq('portal_user_id', clerkUser.id)
      .neq('id', clientId)
      .single()

    if (existing) {
      const row = existing as { id: string; name: string }
      return { success: false, error: `이미 다른 대상자(${row.name})에 연결된 계정입니다` }
    }

    const { error } = await supabase
      .from('clients')
      .update({ portal_user_id: clerkUser.id, updated_at: new Date().toISOString() })
      .eq('id', clientId)

    if (error) {
      console.error('linkPortalUserByName update:', error)
      return { success: false, error: '연결에 실패했습니다' }
    }

    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in linkPortalUserByName:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다' }
  }
}

export async function unlinkPortalUser(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('clients')
      .update({ portal_user_id: null, updated_at: new Date().toISOString() })
      .eq('id', clientId)

    if (error) {
      console.error('unlinkPortalUser update:', error)
      return { success: false, error: '연결 해제에 실패했습니다' }
    }

    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in unlinkPortalUser:', error)
    return { success: false, error: '예상치 못한 오류가 발생했습니다' }
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

const GRANT_STATUS: Record<string, string> = { draft: '작성 중', submitted: '제출 완료' }
const RENTAL_STATUS: Record<string, string> = { rented: '대여 중', overdue: '연체' }
const CUSTOM_STATUS: Record<string, string> = {
  design: '설계', manufacturing: '제작', inspection: '검수', delivery: '납품',
}
const APP_CATEGORY: Record<string, string> = {
  consult: '상담', experience: '체험', custom: '맞춤형',
  aftercare: '사후관리', education: '교육/홍보',
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

export interface SimilarClient {
  id: string
  name: string
  birth_date: string | null
  disability_type: string | null
  disability_grade: string | null
  service_record_count: number
}

export async function getSimilarClients(
  clientId: string,
  disabilityType: string | null,
  limit = 5
): Promise<{ success: boolean; clients?: SimilarClient[]; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }
    if (!disabilityType) return { success: true, clients: [] }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("clients")
      .select("id, name, birth_date, disability_type, disability_grade")
      .eq("disability_type", disabilityType)
      .eq("status", "registered")
      .neq("id", clientId)
      .limit(limit)

    if (error) {
      console.error("getSimilarClients:", error)
      return { success: false, error: "유사 대상자 조회에 실패했습니다" }
    }

    const rows = (data || []) as Array<{
      id: string
      name: string
      birth_date: string | null
      disability_type: string | null
      disability_grade: string | null
    }>

    const clients: SimilarClient[] = await Promise.all(
      rows.map(async (c) => {
        const { count } = await (supabase as any)
          .from("eval_service_records")
          .select("*", { count: "exact", head: true })
          .eq("client_id", c.id)

        return {
          id: c.id,
          name: c.name,
          birth_date: c.birth_date,
          disability_type: c.disability_type,
          disability_grade: c.disability_grade,
          service_record_count: count ?? 0,
        }
      })
    )

    clients.sort((a, b) => b.service_record_count - a.service_record_count)

    return { success: true, clients }
  } catch (e) {
    console.error("Unexpected error in getSimilarClients:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
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

    for (const clientId of Object.keys(data)) {
      data[clientId].sort((a, b) =>
        (new Date(b.started_at).getTime() || 0) - (new Date(a.started_at).getTime() || 0)
      )
    }
    return { success: true, data }
  } catch (e) {
    console.error('getActiveServiceBadgesByClientIds:', e)
    return { success: false, error: '예상치 못한 오류가 발생했습니다' }
  }
}

// ─────────────────────────────────────────────────────
// E-6: 대상자 생애주기 관리
// ─────────────────────────────────────────────────────

export type LifecycleStatus = 'active' | 'inactive' | 'closed' | 'readmit'

export async function updateClientLifecycle(
  clientId: string,
  lifecycleStatus: LifecycleStatus
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase
    .from('clients')
    .update({ lifecycle_status: lifecycleStatus, updated_at: new Date().toISOString() })
    .eq('id', clientId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────
// E-6: 대상자 태그 관리
// ─────────────────────────────────────────────────────

export async function getClientTags(
  clientId: string
): Promise<{ success: boolean; tags?: ClientTag[]; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from('client_tags')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, tags: (data ?? []) as ClientTag[] }
}

export async function addClientTag(
  clientId: string,
  tag: string
): Promise<{ success: boolean; tag?: ClientTag; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const { userId } = await (await import('@clerk/nextjs/server')).auth()
  if (!userId) return { success: false, error: '로그인이 필요합니다' }

  const trimmed = tag.trim().slice(0, 20)
  if (!trimmed) return { success: false, error: '태그를 입력해주세요' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from('client_tags')
    .insert({ client_id: clientId, tag: trimmed, created_by: userId })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { success: false, error: '이미 존재하는 태그입니다' }
    return { success: false, error: error.message }
  }
  revalidatePath(`/clients/${clientId}`)
  return { success: true, tag: data as ClientTag }
}

export async function removeClientTag(
  tagId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase
    .from('client_tags')
    .delete()
    .eq('id', tagId)

  if (error) return { success: false, error: error.message }
  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

