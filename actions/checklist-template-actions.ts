"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { withStaffPermission } from "@/lib/utils/with-permission"

export interface ChecklistTemplate {
  question_id: string
  question_text: string
  question_order: number
  hint_text: string | null
}

export async function getChecklistTemplates(
  itemCategory: string
): Promise<{ success: boolean; templates?: ChecklistTemplate[]; error?: string }> {
  return withStaffPermission(async () => {
    try {

      const supabase = createAdminClient()
      const { data, error } = await (supabase as any)
        .from("eval_item_checklist_templates")
        .select("question_id, question_text, question_order, hint_text")
        .eq("item_category", itemCategory)
        .eq("is_active", true)
        .order("question_order", { ascending: true })

      if (error) return { success: false, error: "체크리스트 조회에 실패했습니다" }
      return { success: true, templates: (data ?? []) as ChecklistTemplate[] }
    } catch (e) {
      console.error("getChecklistTemplates:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}
