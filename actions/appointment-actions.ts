'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { revalidatePath } from 'next/cache'

// ─── Types ───────────────────────────────────────────────────

export interface AppointmentSlot {
  id: string
  staff_id: string
  slot_date: string
  slot_time: string
  duration_minutes: number
  service_types: string[]
  max_bookings: number
  current_bookings: number
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentRequest {
  id: string
  slot_id: string | null
  client_id: string | null
  portal_user_id: string
  requester_name: string | null
  requester_contact: string | null
  service_type: string
  notes: string | null
  status: 'pending_review' | 'confirmed' | 'rejected' | 'cancelled'
  assigned_staff_id: string | null
  staff_note: string | null
  schedule_id: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentRequestWithDetails extends AppointmentRequest {
  slot_date: string | null
  slot_time: string | null
  client_name: string | null
}

export interface MyAppointment extends AppointmentRequest {
  slot_date: string | null
  slot_time: string | null
  duration_minutes: number | null
}

export interface CreateSlotInput {
  slot_date: string
  slot_time: string
  duration_minutes?: number
  service_types?: string[]
  max_bookings?: number
  notes?: string
  is_active?: boolean
}

export interface RequestAppointmentInput {
  slot_id: string
  service_type: string
  notes?: string
  requester_name?: string
  requester_contact?: string
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  consult: '보조기기 상담',
  assessment: '보조기기 평가',
  exhibition: '체험·전시',
  etc: '기타 문의',
}

// ─── Helper ──────────────────────────────────────────────────

async function resolveClientId(userId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('clients')
    .select('id')
    .eq('portal_user_id', userId)
    .single()
  return (data as { id: string } | null)?.id ?? null
}

// ─── Portal (client-facing) ──────────────────────────────────

export async function getAvailableSlots(fromDate?: string, toDate?: string): Promise<{
  success: boolean
  slots?: AppointmentSlot[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()
    const today = fromDate ?? new Date().toISOString().slice(0, 10)
    let query = supabase
      .from('appointment_slots')
      .select('*')
      .eq('is_active', true)
      .gte('slot_date', today)
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true })

    if (toDate) query = query.lte('slot_date', toDate)

    const { data, error } = await query
    if (error) return { success: false, error: error.message }

    const slots = ((data ?? []) as AppointmentSlot[]).filter(
      s => s.current_bookings < s.max_bookings
    )
    return { success: true, slots }
  } catch {
    return { success: false, error: '슬롯 조회에 실패했습니다' }
  }
}

export async function getMyAppointments(): Promise<{
  success: boolean
  appointments?: MyAppointment[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: '로그인이 필요합니다' }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('appointment_requests')
      .select('*, appointment_slots(slot_date, slot_time, duration_minutes)')
      .eq('portal_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }

    const appointments = ((data ?? []) as (AppointmentRequest & {
      appointment_slots: { slot_date: string; slot_time: string; duration_minutes: number } | null
    })[]).map(r => ({
      ...r,
      slot_date: r.appointment_slots?.slot_date ?? null,
      slot_time: r.appointment_slots?.slot_time ?? null,
      duration_minutes: r.appointment_slots?.duration_minutes ?? null,
    }))

    return { success: true, appointments }
  } catch {
    return { success: false, error: '예약 조회에 실패했습니다' }
  }
}

export async function requestAppointment(input: RequestAppointmentInput): Promise<{
  success: boolean
  id?: string
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: '로그인이 필요합니다' }

    const supabase = createAdminClient()

    // Check slot availability
    const { data: slot } = await supabase
      .from('appointment_slots')
      .select('id, current_bookings, max_bookings, is_active')
      .eq('id', input.slot_id)
      .single()

    if (!slot || !slot.is_active) return { success: false, error: '유효하지 않은 슬롯입니다' }
    if (slot.current_bookings >= slot.max_bookings) return { success: false, error: '해당 시간대 예약이 마감되었습니다' }

    const clientId = await resolveClientId(userId)

    const { data: req, error: reqError } = await supabase
      .from('appointment_requests')
      .insert({
        slot_id: input.slot_id,
        client_id: clientId,
        portal_user_id: userId,
        service_type: input.service_type,
        notes: input.notes ?? null,
        requester_name: input.requester_name ?? null,
        requester_contact: input.requester_contact ?? null,
        status: 'pending_review',
      })
      .select('id')
      .single()

    if (reqError || !req) return { success: false, error: '예약 신청에 실패했습니다' }

    // Increment slot bookings
    await supabase
      .from('appointment_slots')
      .update({ current_bookings: slot.current_bookings + 1 })
      .eq('id', input.slot_id)

    revalidatePath('/appointments')
    revalidatePath('/mypage')

    // Notify staff (best-effort)
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('notifications').insert({
        type: 'schedule',
        title: '새 상담 예약 신청',
        body: `${SERVICE_TYPE_LABELS[input.service_type] ?? input.service_type} 예약 신청이 접수되었습니다`,
        is_global: true,
      })
    } catch { /* non-critical */ }

    return { success: true, id: (req as { id: string }).id }
  } catch {
    return { success: false, error: '예약 신청 중 오류가 발생했습니다' }
  }
}

export async function cancelMyAppointment(requestId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: '로그인이 필요합니다' }

    const supabase = createAdminClient()

    const { data: req } = await supabase
      .from('appointment_requests')
      .select('id, status, slot_id, portal_user_id')
      .eq('id', requestId)
      .single()

    if (!req || (req as AppointmentRequest).portal_user_id !== userId)
      return { success: false, error: '본인의 예약만 취소할 수 있습니다' }

    const r = req as AppointmentRequest
    if (r.status === 'rejected' || r.status === 'cancelled')
      return { success: false, error: '이미 취소된 예약입니다' }

    await supabase
      .from('appointment_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)

    // If confirmed, release the slot
    if (r.status === 'confirmed' && r.slot_id) {
      const { data: slot } = await supabase
        .from('appointment_slots')
        .select('current_bookings')
        .eq('id', r.slot_id)
        .single()
      if (slot) {
        await supabase
          .from('appointment_slots')
          .update({ current_bookings: Math.max(0, (slot as { current_bookings: number }).current_bookings - 1) })
          .eq('id', r.slot_id)
      }
    }

    revalidatePath('/appointments')
    revalidatePath('/mypage')
    return { success: true }
  } catch {
    return { success: false, error: '취소 처리에 실패했습니다' }
  }
}

// ─── Staff (admin-facing) ────────────────────────────────────

export async function getAppointmentSlots(year?: number, month?: number): Promise<{
  success: boolean
  slots?: AppointmentSlot[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()
    let query = supabase
      .from('appointment_slots')
      .select('*')
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true })

    if (year && month) {
      const from = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
      query = query.gte('slot_date', from).lte('slot_date', to)
    }

    const { data, error } = await query
    if (error) return { success: false, error: error.message }
    return { success: true, slots: (data ?? []) as AppointmentSlot[] }
  } catch {
    return { success: false, error: '슬롯 조회에 실패했습니다' }
  }
}

export async function createAppointmentSlot(input: CreateSlotInput): Promise<{
  success: boolean
  id?: string
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const { userId } = await auth()
    if (!userId) return { success: false, error: '로그인이 필요합니다' }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('appointment_slots')
      .insert({
        staff_id: userId,
        slot_date: input.slot_date,
        slot_time: input.slot_time,
        duration_minutes: input.duration_minutes ?? 60,
        service_types: input.service_types ?? ['consult'],
        max_bookings: input.max_bookings ?? 1,
        is_active: input.is_active ?? true,
        notes: input.notes ?? null,
      })
      .select('id')
      .single()

    if (error || !data) return { success: false, error: '슬롯 생성에 실패했습니다' }

    revalidatePath('/appointments')
    return { success: true, id: (data as { id: string }).id }
  } catch {
    return { success: false, error: '슬롯 생성 중 오류가 발생했습니다' }
  }
}

export async function updateAppointmentSlot(id: string, input: Partial<CreateSlotInput>): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('appointment_slots')
      .update(input)
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/appointments')
    return { success: true }
  } catch {
    return { success: false, error: '슬롯 수정에 실패했습니다' }
  }
}

export async function deleteAppointmentSlot(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()
    const { data: slot } = await supabase
      .from('appointment_slots')
      .select('current_bookings')
      .eq('id', id)
      .single()

    if (slot && (slot as AppointmentSlot).current_bookings > 0)
      return { success: false, error: '예약이 있는 슬롯은 삭제할 수 없습니다 (비활성화 사용)' }

    const { error } = await supabase.from('appointment_slots').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/appointments')
    return { success: true }
  } catch {
    return { success: false, error: '슬롯 삭제에 실패했습니다' }
  }
}

export async function getPendingAppointmentRequests(): Promise<{
  success: boolean
  requests?: AppointmentRequestWithDetails[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('appointment_requests')
      .select('*, appointment_slots(slot_date, slot_time), clients(name)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true })

    if (error) return { success: false, error: error.message }

    const requests = ((data ?? []) as (AppointmentRequest & {
      appointment_slots: { slot_date: string; slot_time: string } | null
      clients: { name: string } | null
    })[]).map(r => ({
      ...r,
      slot_date: r.appointment_slots?.slot_date ?? null,
      slot_time: r.appointment_slots?.slot_time ?? null,
      client_name: r.clients?.name ?? r.requester_name ?? null,
    }))

    return { success: true, requests }
  } catch {
    return { success: false, error: '대기 예약 조회에 실패했습니다' }
  }
}

export async function getAllAppointmentRequests(filters?: {
  status?: string
}): Promise<{
  success: boolean
  requests?: AppointmentRequestWithDetails[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()
    let query = supabase
      .from('appointment_requests')
      .select('*, appointment_slots(slot_date, slot_time), clients(name)')
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)

    const { data, error } = await query
    if (error) return { success: false, error: error.message }

    const requests = ((data ?? []) as (AppointmentRequest & {
      appointment_slots: { slot_date: string; slot_time: string } | null
      clients: { name: string } | null
    })[]).map(r => ({
      ...r,
      slot_date: r.appointment_slots?.slot_date ?? null,
      slot_time: r.appointment_slots?.slot_time ?? null,
      client_name: r.clients?.name ?? r.requester_name ?? null,
    }))

    return { success: true, requests }
  } catch {
    return { success: false, error: '예약 조회에 실패했습니다' }
  }
}

export async function confirmAppointmentRequest(
  requestId: string,
  input: { assignedStaffId?: string; staffNote?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()

    const { data: req } = await supabase
      .from('appointment_requests')
      .select('*, appointment_slots(slot_date, slot_time, duration_minutes), clients(id)')
      .eq('id', requestId)
      .single()

    if (!req) return { success: false, error: '예약 신청을 찾을 수 없습니다' }

    const r = req as AppointmentRequest & {
      appointment_slots: { slot_date: string; slot_time: string; duration_minutes: number } | null
    }

    // Create a schedule entry if slot info is available
    let scheduleId: string | null = null
    if (r.appointment_slots && r.slot_id && input.assignedStaffId) {
      const { slot_date, slot_time } = r.appointment_slots
      const adminSupabase = createAdminClient()
      const { data: sched } = await adminSupabase
        .from('schedules')
        .insert({
          title: `상담 예약 — ${SERVICE_TYPE_LABELS[r.service_type] ?? r.service_type}`,
          scheduled_date: slot_date,
          start_time: slot_time,
          schedule_type: 'consult',
          client_id: r.client_id ?? null,
          staff_id: input.assignedStaffId,
          is_web_visible: false,
        })
        .select('id')
        .single()
      scheduleId = (sched as { id: string } | null)?.id ?? null
    }

    await supabase
      .from('appointment_requests')
      .update({
        status: 'confirmed',
        assigned_staff_id: input.assignedStaffId ?? null,
        staff_note: input.staffNote ?? null,
        schedule_id: scheduleId,
      })
      .eq('id', requestId)

    // Notify the client
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('notifications').insert({
        type: 'schedule',
        title: '예약이 확정되었습니다',
        body: `${SERVICE_TYPE_LABELS[r.service_type] ?? r.service_type} 예약이 확정되었습니다. 담당자가 연락드릴 예정입니다.`,
        clerk_user_id: r.portal_user_id,
      })
    } catch { /* non-critical */ }

    revalidatePath('/appointments')
    revalidatePath('/schedule')
    return { success: true }
  } catch {
    return { success: false, error: '예약 확정 처리에 실패했습니다' }
  }
}

export async function rejectAppointmentRequest(
  requestId: string,
  staffNote?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()

    const { data: req } = await supabase
      .from('appointment_requests')
      .select('portal_user_id, service_type')
      .eq('id', requestId)
      .single()

    await supabase
      .from('appointment_requests')
      .update({ status: 'rejected', staff_note: staffNote ?? null })
      .eq('id', requestId)

    if (req) {
      const r = req as { portal_user_id: string; service_type: string }
      try {
        const adminSupabase = createAdminClient()
        await adminSupabase.from('notifications').insert({
          type: 'schedule',
          title: '예약 신청이 반려되었습니다',
          body: `${SERVICE_TYPE_LABELS[r.service_type] ?? r.service_type} 예약 신청이 반려되었습니다.${staffNote ? ` 사유: ${staffNote}` : ''}`,
          clerk_user_id: r.portal_user_id,
        })
      } catch { /* non-critical */ }
    }

    revalidatePath('/appointments')
    return { success: true }
  } catch {
    return { success: false, error: '예약 반려 처리에 실패했습니다' }
  }
}
