'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import type {
  HrTraining,
  HrTrainingAttendee,
  TrainingWithAttendees,
  CreateTrainingInput,
  UpdateTrainingInput,
  UpsertTrainingAttendeeInput,
} from '@co-at/types'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getTrainings(year?: number): Promise<Result<HrTraining[]>> {
  try {
    const supabase = createSupabaseAdmin()
    let query = supabase
      .from('hr_trainings')
      .select('*')
      .order('start_date', { ascending: false })

    if (year) {
      query = query
        .gte('start_date', `${year}-01-01`)
        .lte('start_date', `${year}-12-31`)
    }

    const { data, error } = await query
    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as HrTraining[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getTrainingWithAttendees(id: string): Promise<Result<TrainingWithAttendees>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_trainings')
      .select('*, attendees:hr_training_attendees(*, employee:hr_employees(name,department))')
      .eq('id', id)
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data: data as unknown as TrainingWithAttendees }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function createTraining(input: CreateTrainingInput): Promise<Result<HrTraining>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_trainings')
      .insert({
        title:       input.title,
        category:    input.category,
        start_date:  input.start_date,
        end_date:    input.end_date,
        hours:       input.hours,
        provider:    input.provider ?? null,
        description: input.description ?? null,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/training')
    return { success: true, data: data as HrTraining }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateTraining(id: string, input: UpdateTrainingInput): Promise<Result<HrTraining>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_trainings')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/training')
    return { success: true, data: data as HrTraining }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteTraining(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('hr_trainings').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/training')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function upsertTrainingAttendee(
  input: UpsertTrainingAttendeeInput
): Promise<Result<HrTrainingAttendee>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_training_attendees')
      .upsert(
        {
          training_id: input.training_id,
          employee_id: input.employee_id,
          attended:    input.attended,
          note:        input.note ?? null,
        },
        { onConflict: 'training_id,employee_id' }
      )
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/training')
    return { success: true, data: data as HrTrainingAttendee }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function removeTrainingAttendee(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('hr_training_attendees').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/training')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
