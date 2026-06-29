"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import {getCurrentUserProfileId } from "@/lib/utils/permissions"
import { withStaffPermission } from "@/lib/utils/with-permission"
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
    return null
  }

  return data as Resource
}

export async function createResource(
  input: CreateResourceInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  return withStaffPermission(async () => {

    const profileId = await getCurrentUserProfileId()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("resources")
      .insert({ ...input, created_by: profileId })
      .select("id")
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/info/resources")
    return { success: true, id: (data as { id: string }).id }
  })
}

export async function updateResource(
  input: UpdateResourceInput
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const { id, ...updateData } = input
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("resources")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/info/resources")
    return { success: true }
  })
}

export async function deleteResource(
  id: string
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {

    const supabase = createAdminClient()

    const { error } = await supabase.from("resources").delete().eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/info/resources")
    return { success: true }
  })
}
