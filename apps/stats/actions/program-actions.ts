"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export type ExhibitionSchedule = {
  id: string
  scheduled_date: string
  notes: string | null
  participant_count: number | null
  reception_method: string | null
  visitor_org_name: string | null
  visitor_org_type: string | null
}

export type EducationSchedule = {
  id: string
  scheduled_date: string
  notes: string | null
  education_title: string | null
  education_hours: number | null
  education_type: string | null
  participant_count: number | null
  education_audience_type: string | null
  education_audience_label: string | null
}

export async function getExhibitionSchedules(year: number): Promise<ExhibitionSchedule[]> {
  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('schedules')
    .select('id, scheduled_date, notes, participant_count, reception_method, visitor_org_name, visitor_org_type')
    .eq('schedule_type', 'exhibition')
    .gte('scheduled_date', `${year}-01-01`)
    .lte('scheduled_date', `${year}-12-31`)
    .order('scheduled_date')
  return (data ?? []) as ExhibitionSchedule[]
}

export async function getEducationSchedules(year: number): Promise<EducationSchedule[]> {
  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('schedules')
    .select('id, scheduled_date, notes, education_title, education_hours, education_type, participant_count, education_audience_type, education_audience_label')
    .eq('schedule_type', 'education')
    .gte('scheduled_date', `${year}-01-01`)
    .lte('scheduled_date', `${year}-12-31`)
    .order('scheduled_date')
  return (data ?? []) as EducationSchedule[]
}

export async function updateExhibitionRecord(
  id: string,
  data: Pick<ExhibitionSchedule, 'participant_count' | 'reception_method' | 'visitor_org_name' | 'visitor_org_type'>
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }
  const supabase = createAdminClient()
  const { error } = await (supabase as any).from('schedules').update(data).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/programs')
  return { success: true }
}

export async function updateEducationRecord(
  id: string,
  data: Pick<EducationSchedule, 'education_title' | 'education_hours' | 'education_type' | 'participant_count' | 'education_audience_type' | 'education_audience_label' | 'notes'>
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }
  const supabase = createAdminClient()
  const { error } = await (supabase as any).from('schedules').update(data).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/programs')
  return { success: true }
}
