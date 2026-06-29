"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { withStaffPermission } from "@/lib/utils/with-permission"
import { revalidatePath } from "next/cache"

export interface ScheduleCategory {
  id: string
  name: string
  color: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string | null
}

export async function getScheduleCategories(): Promise<ScheduleCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("schedule_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("[카테고리 조회] 실패:", error)
    return []
  }
  return (data || []) as ScheduleCategory[]
}

export async function createScheduleCategory(input: {
  name: string
  color: string
  description?: string
}): Promise<{ success: boolean; data?: ScheduleCategory; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()
    const { data: last } = await supabase
      .from("schedule_categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    const sort_order = ((last as { sort_order: number } | null)?.sort_order ?? 0) + 1

    const { data, error } = await supabase
      .from("schedule_categories")
      .insert({ name: input.name, color: input.color, description: input.description ?? null, sort_order })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath("/schedule")
    return { success: true, data: data as ScheduleCategory }
  })
}

export async function updateScheduleCategory(
  id: string,
  input: Partial<{ name: string; color: string; description: string; is_active: boolean }>
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("schedule_categories")
      .update(input)
      .eq("id", id)

    if (error) return { success: false, error: error.message }
    revalidatePath("/schedule")
    return { success: true }
  })
}

export async function deleteScheduleCategory(
  id: string
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("schedule_categories")
      .update({ is_active: false })
      .eq("id", id)

    if (error) return { success: false, error: error.message }
    revalidatePath("/schedule")
    return { success: true }
  })
}
