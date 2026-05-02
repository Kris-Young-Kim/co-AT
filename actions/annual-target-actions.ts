"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

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

export type UpsertTargetInput = Omit<AnnualTarget, 'id' | 'created_at' | 'updated_at'>

export async function getAnnualTarget(year: number): Promise<{
  success: boolean
  target?: AnnualTarget
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('annual_targets')
    .select('*')
    .eq('year', year)
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  return { success: true, target: data as AnnualTarget | undefined }
}

export async function upsertAnnualTarget(
  input: UpsertTargetInput
): Promise<{ success: boolean; target?: AnnualTarget; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('annual_targets')
    .upsert({ ...input, updated_at: new Date().toISOString() }, { onConflict: 'year' })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/targets')
  return { success: true, target: data as AnnualTarget }
}
