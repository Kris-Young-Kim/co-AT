'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type {
  HrBusinessTrip,
  CreateBusinessTripInput,
  ReviewBusinessTripInput,
} from '@co-at/types'

type TripWithEmployee = HrBusinessTrip & {
  hr_employees: { name: string; department: string } | null
}

export async function getBusinessTrips(params?: {
  status?: string
  employeeId?: string
  year?: number
}): Promise<TripWithEmployee[]> {
  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('hr_business_trips')
    .select('*, hr_employees(name, department)')
    .order('start_date', { ascending: false })

  if (params?.status) query = query.eq('status', params.status)
  if (params?.employeeId) query = query.eq('employee_id', params.employeeId)
  if (params?.year) {
    query = query
      .gte('start_date', `${params.year}-01-01`)
      .lte('start_date', `${params.year}-12-31`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as TripWithEmployee[]
}

export async function createBusinessTrip(input: CreateBusinessTripInput): Promise<void> {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('hr_business_trips').insert({
    employee_id: input.employee_id,
    destination: input.destination,
    purpose: input.purpose,
    start_date: input.start_date,
    end_date: input.end_date,
    days: input.days,
    transport: input.transport ?? null,
    allowance: input.allowance ?? 0,
    note: input.note ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function reviewBusinessTrip(input: ReviewBusinessTripInput): Promise<void> {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('hr_business_trips')
    .update({
      status: input.status,
      reviewed_by: input.reviewed_by,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', input.id)
  if (error) throw new Error(error.message)
}

export async function deleteBusinessTrip(id: string): Promise<void> {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('hr_business_trips')
    .delete()
    .eq('id', id)
    .eq('status', 'pending')
  if (error) throw new Error(error.message)
}
