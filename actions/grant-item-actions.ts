"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { withStaffPermission } from "@/lib/utils/with-permission"
import { revalidatePath } from "next/cache"

export interface GrantItemInput {
  item_category?: string
  item_name?: string | null
  use_plan?: string | null
  use_location?: string | null
  use_location_detail?: string | null
  usage_experience?: boolean | null
  self_usage_possible?: boolean | null
  support_person?: string | null
  score_env?: number | null
  score_operation?: number | null
  score_disability?: number | null
  score_use_plan?: number | null
  score_effectiveness?: number | null
  checklist_responses?: Record<string, boolean> | null
  item_opinion?: string | null
  item_result?: string | null
  recommended_model?: string | null
  vendor_name?: string | null
  vendor_phone?: string | null
  support_amount?: number | null
  has_self_pay?: boolean | null
  final_item_name?: string | null
  item_remarks?: string | null
}

export async function upsertGrantItem(
  assessmentId: string,
  itemOrder: number,
  input: GrantItemInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  return withStaffPermission(async () => {
    try {

      const supabase = createAdminClient()

      const { data, error } = await (supabase as any)
        .from("eval_grant_items")
        .upsert(
          { assessment_id: assessmentId, item_order: itemOrder, ...input },
          { onConflict: "assessment_id,item_order" }
        )
        .select("id")
        .single()

      if (error) {
        return { success: false, error: error.message ?? "품목 저장에 실패했습니다" }
      }

      revalidatePath(`/grant-eval/${assessmentId}`)
      return { success: true, id: (data as { id: string }).id }
    } catch (e) {
      console.error("upsertGrantItem unexpected:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}

export async function deleteGrantItem(
  assessmentId: string,
  itemOrder: number
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {
    try {

      const supabase = createAdminClient()
      const { error } = await (supabase as any)
        .from("eval_grant_items")
        .delete()
        .eq("assessment_id", assessmentId)
        .eq("item_order", itemOrder)

      if (error) return { success: false, error: "품목 삭제에 실패했습니다" }

      revalidatePath(`/grant-eval/${assessmentId}`)
      return { success: true }
    } catch (e) {
      console.error("deleteGrantItem:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}
