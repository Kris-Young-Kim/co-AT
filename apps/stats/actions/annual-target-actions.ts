'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface AnnualTarget {
  id: string
  year: number
  consultation: number
  experience: number
  rental: number
  custom_make: number
  cleaning: number
  repair: number
  reuse: number
  professional_edu: number
  promotion: number
  created_at: string | null
  updated_at: string | null
}

export interface UpsertTargetInput {
  year: number
  consultation: number
  experience: number
  rental: number
  custom_make: number
  cleaning: number
  repair: number
  reuse: number
  professional_edu: number
  promotion: number
}

export async function getAnnualTarget(year: number): Promise<
  { success: true; target: AnnualTarget | null } | { success: false; error: string }
> {
  try {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('annual_targets')
      .select('*')
      .eq('year', year)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    return { success: true, target: data as AnnualTarget | null }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function upsertAnnualTarget(input: UpsertTargetInput): Promise<
  { success: boolean; error?: string }
> {
  try {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('annual_targets')
      .upsert({ ...input, updated_at: new Date().toISOString() }, { onConflict: 'year' })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
