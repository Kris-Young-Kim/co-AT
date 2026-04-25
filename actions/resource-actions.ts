"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission, getCurrentUserProfileId } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export interface Resource {
  id: string
  type: "document" | "video"
  title: string
  description: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  youtube_ids: string[] | null
  resource_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateResourceInput {
  type: "document" | "video"
  title: string
  description?: string
  file_url?: string
  file_name?: string
  file_size?: number
  youtube_ids?: string[]
  resource_date?: string
}

export interface UpdateResourceInput {
  id: string
  title?: string
  description?: string
  file_url?: string
  file_name?: string
  file_size?: number
  youtube_ids?: string[]
  resource_date?: string
}

export async function getResources(type?: "document" | "video"): Promise<Resource[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from("resources")
    .select("*")
    .order("resource_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (type) {
    query = query.eq("type", type)
  }

  const { data, error } = await query

  if (error) {
    console.error("[Resource Actions] 자료 조회 실패:", error)
    return []
  }

  return (data || []) as Resource[]
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("[Resource Actions] 자료 상세 조회 실패:", error)
    return null
  }

  return data as Resource
}

export async function createResource(
  input: CreateResourceInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const profileId = await getCurrentUserProfileId()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("resources")
    .insert({ ...input, created_by: profileId })
    .select("id")
    .single()

  if (error) {
    console.error("[Resource Actions] 자료 생성 실패:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/info/resources")
  return { success: true, id: (data as { id: string }).id }
}

export async function updateResource(
  input: UpdateResourceInput
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const { id, ...updateData } = input
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("resources")
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("[Resource Actions] 자료 수정 실패:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/info/resources")
  return { success: true }
}

export async function deleteResource(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()

  const { error } = await supabase.from("resources").delete().eq("id", id)

  if (error) {
    console.error("[Resource Actions] 자료 삭제 실패:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/info/resources")
  return { success: true }
}
