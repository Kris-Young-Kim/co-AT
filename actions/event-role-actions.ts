// actions/event-role-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export interface EventRole {
  id: string
  schedule_id: string
  role_name: string
  assignee_name: string
  notes: string | null
  sort_order: number
  created_by: string
  created_at: string
}

export interface CreateEventRoleInput {
  schedule_id: string
  role_name: string
  assignee_name: string
  notes?: string
}

// 행사에서 자주 쓰는 역할 프리셋
export const ROLE_PRESETS = [
  '진행자', '등록', '안내', '촬영/기록', '차량 지원',
  '물품 준비', '강사', '보조강사', '행정 지원', '기타'
]

export async function getEventRoles(scheduleId: string): Promise<{
  success: boolean
  roles?: EventRole[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('event_roles')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('sort_order')
      .order('created_at')

    if (error) throw error
    return { success: true, roles: data as EventRole[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function createEventRole(input: CreateEventRoleInput): Promise<{
  success: boolean
  role?: EventRole
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('event_roles')
      .insert({
        schedule_id: input.schedule_id,
        role_name: input.role_name,
        assignee_name: input.assignee_name,
        notes: input.notes ?? null,
        sort_order: 0,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error
    revalidatePath('/schedule')
    return { success: true, role: data as EventRole }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteEventRole(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { error } = await (supabase as any).from('event_roles').delete().eq('id', id)

    if (error) throw error
    revalidatePath('/schedule')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
