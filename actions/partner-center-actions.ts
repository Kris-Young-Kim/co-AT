"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { withStaffPermission } from "@/lib/utils/with-permission"
import { revalidatePath } from "next/cache"

export interface PartnerCenter {
  id: string
  name: string
  region: string
  district: string
  phone: string
  fax: string | null
  email: string | null
  address: string | null
  website: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export interface PartnerCenterInput {
  name: string
  region: string
  district: string
  phone: string
  fax?: string | null
  email?: string | null
  address?: string | null
  website?: string | null
  memo?: string | null
}

export async function listPartnerCenters(): Promise<{
  success: boolean
  centers?: PartnerCenter[]
  error?: string
}> {
  return withStaffPermission(async () => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from("partner_centers")
        .select("*")
        .order("region")
        .order("name")

      if (error) return { success: false, error: "협력기관 목록 조회에 실패했습니다" }
      return { success: true, centers: (data ?? []) as PartnerCenter[] }
    } catch (e) {
      console.error("listPartnerCenters:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}

export async function createPartnerCenter(input: PartnerCenterInput): Promise<{
  success: boolean
  id?: string
  error?: string
}> {
  return withStaffPermission(async () => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from("partner_centers")
        .insert(input)
        .select("id")
        .single()

      if (error || !data) return { success: false, error: "협력기관 추가에 실패했습니다" }

      revalidatePath("/partner-centers")
      return { success: true, id: data.id }
    } catch (e) {
      console.error("createPartnerCenter:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}

export async function updatePartnerCenter(
  id: string,
  input: Partial<PartnerCenterInput>
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {
    try {
      const supabase = createAdminClient()
      const { error } = await supabase
        .from("partner_centers")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) return { success: false, error: "협력기관 수정에 실패했습니다" }

      revalidatePath("/partner-centers")
      return { success: true }
    } catch (e) {
      console.error("updatePartnerCenter:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}

export async function deletePartnerCenter(id: string): Promise<{
  success: boolean
  error?: string
}> {
  return withStaffPermission(async () => {
    try {
      const supabase = createAdminClient()
      const { error } = await supabase
        .from("partner_centers")
        .delete()
        .eq("id", id)

      if (error) return { success: false, error: "협력기관 삭제에 실패했습니다" }

      revalidatePath("/partner-centers")
      return { success: true }
    } catch (e) {
      console.error("deletePartnerCenter:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}
