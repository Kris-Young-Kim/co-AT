// actions/meeting-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export type MeetingType = 'weekly' | 'monthly' | 'biweekly_policy' | 'other'

export interface ActionItem {
  id: string
  content: string
  assignee: string
  done: boolean
}

export interface MeetingMinutes {
  id: string
  schedule_id: string
  meeting_type: MeetingType
  attendees: string[]
  agenda: string | null
  minutes: string | null
  action_items: ActionItem[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface SaveMeetingMinutesInput {
  schedule_id: string
  meeting_type: MeetingType
  attendees: string[]
  agenda?: string
  minutes?: string
  action_items?: ActionItem[]
}

export async function getMeetingMinutes(scheduleId: string): Promise<{
  success: boolean
  minutes?: MeetingMinutes | null
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('meeting_minutes')
      .select('*')
      .eq('schedule_id', scheduleId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { success: true, minutes: data as MeetingMinutes | null }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function saveMeetingMinutes(input: SaveMeetingMinutesInput): Promise<{
  success: boolean
  minutes?: MeetingMinutes
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('meeting_minutes')
      .upsert(
        {
          schedule_id: input.schedule_id,
          meeting_type: input.meeting_type,
          attendees: input.attendees,
          agenda: input.agenda ?? null,
          minutes: input.minutes ?? null,
          action_items: input.action_items ?? [],
          created_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'schedule_id' }
      )
      .select()
      .single()

    if (error) throw error
    revalidatePath('/schedule')
    return { success: true, minutes: data as MeetingMinutes }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
