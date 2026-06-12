"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

export interface DeviceOutcomeRow {
  product_name: string
  disability_type: string | null
  count: number
  avg_satisfaction: number | null
  avg_ippa_outcome: number | null
}

export async function getDeviceOutcomes(): Promise<{
  success: boolean
  rows?: DeviceOutcomeRow[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()

    // Fetch service records with product name
    const { data: records, error: recError } = await (supabase as any)
      .from("eval_service_records")
      .select("client_id, product_name, disability_type, satisfaction_score")
      .not("product_name", "is", null)
      .not("product_name", "eq", "")

    if (recError) {
      console.error("getDeviceOutcomes records:", recError)
      return { success: false, error: "서비스 기록 조회에 실패했습니다" }
    }

    // Fetch completed IPPA assessments (outcome_score available)
    const { data: ippaRows, error: ippaError } = await (supabase as any)
      .from("eval_ippa_assessments")
      .select("client_id, outcome_score")
      .not("outcome_score", "is", null)

    if (ippaError) {
      console.error("getDeviceOutcomes ippa:", ippaError)
    }

    // Build IPPA outcome map: client_id → latest outcome_score
    const ippaByClient: Record<string, number> = {}
    ;(ippaRows ?? []).forEach((r: any) => {
      if (r.outcome_score != null) {
        // Keep highest outcome score per client
        if (ippaByClient[r.client_id] == null || r.outcome_score > ippaByClient[r.client_id]) {
          ippaByClient[r.client_id] = r.outcome_score
        }
      }
    })

    // Group records by product_name + disability_type
    const grouped: Record<
      string,
      { product_name: string; disability_type: string | null; satisfactions: number[]; ippaScores: number[] }
    > = {}

    ;(records ?? []).forEach((r: any) => {
      const key = `${r.product_name}||${r.disability_type ?? ""}`
      if (!grouped[key]) {
        grouped[key] = {
          product_name: r.product_name,
          disability_type: r.disability_type ?? null,
          satisfactions: [],
          ippaScores: [],
        }
      }
      if (r.satisfaction_score != null) grouped[key].satisfactions.push(r.satisfaction_score)
      const ippa = ippaByClient[r.client_id]
      if (ippa != null) grouped[key].ippaScores.push(ippa)
    })

    const avg = (arr: number[]) =>
      arr.length === 0 ? null : Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10

    const rows: DeviceOutcomeRow[] = Object.values(grouped)
      .map((g) => ({
        product_name: g.product_name,
        disability_type: g.disability_type,
        count: g.satisfactions.length || (records ?? []).filter(
          (r: any) => r.product_name === g.product_name && (r.disability_type ?? "") === (g.disability_type ?? "")
        ).length,
        avg_satisfaction: avg(g.satisfactions),
        avg_ippa_outcome: avg(g.ippaScores),
      }))
      .sort((a, b) => b.count - a.count)

    return { success: true, rows }
  } catch (error) {
    console.error("Unexpected error in getDeviceOutcomes:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}
