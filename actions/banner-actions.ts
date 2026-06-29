"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { withStaffPermission } from "@/lib/utils/with-permission"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export interface Banner {
  id: string
  title: string
  content: string | null
  image_url: string | null
  link_url: string | null
  link_label: string
  is_active: boolean
  start_at: string | null
  end_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface BannerInput {
  title: string
  content?: string | null
  image_url?: string | null
  link_url?: string | null
  link_label?: string
  is_active?: boolean
  start_at?: string | null
  end_at?: string | null
}

export async function getActiveBanners(): Promise<{ success: boolean; banners?: Banner[]; error?: string }> {
  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()
    const { data, error } = await (supabase as any)
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order("created_at", { ascending: false })

    if (error) return { success: false, error: "배너 조회에 실패했습니다" }
    return { success: true, banners: (data ?? []) as Banner[] }
  } catch (e) {
    console.error("getActiveBanners:", e)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export async function listBanners(): Promise<{ success: boolean; banners?: Banner[]; error?: string }> {
  return withStaffPermission(async () => {
    try {

      const supabase = createAdminClient()
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) return { success: false, error: "배너 목록 조회에 실패했습니다" }
      return { success: true, banners: (data ?? []) as Banner[] }
    } catch (e) {
      console.error("listBanners:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}

export async function createBanner(input: BannerInput): Promise<{ success: boolean; id?: string; error?: string }> {
  return withStaffPermission(async () => {
    try {

      const { userId } = await auth()
      if (!userId) return { success: false, error: "로그인이 필요합니다" }

      const supabase = createAdminClient()
      const { data, error } = await (supabase as any)
        .from("banners")
        .insert({ ...input, created_by: userId })
        .select("id")
        .single()

      if (error || !data) return { success: false, error: "배너 생성에 실패했습니다" }

      revalidatePath("/banners")
      return { success: true, id: (data as { id: string }).id }
    } catch (e) {
      console.error("createBanner:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}

export async function updateBanner(
  id: string,
  input: Partial<BannerInput>
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {
    try {

      const supabase = createAdminClient()
      const { error } = await (supabase as any)
        .from("banners")
        .update(input)
        .eq("id", id)

      if (error) return { success: false, error: "배너 수정에 실패했습니다" }

      revalidatePath("/banners")
      return { success: true }
    } catch (e) {
      console.error("updateBanner:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}

export async function deleteBanner(id: string): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {
    try {

      const supabase = createAdminClient()
      const { error } = await (supabase as any)
        .from("banners")
        .delete()
        .eq("id", id)

      if (error) return { success: false, error: "배너 삭제에 실패했습니다" }

      revalidatePath("/banners")
      return { success: true }
    } catch (e) {
      console.error("deleteBanner:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}
