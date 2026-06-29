"use server"

import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from "@/lib/supabase/admin"
import { withStaffPermission } from "@/lib/utils/with-permission"

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
  return withStaffPermission(async () => {
    try {

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
  })
}

// ─── 품목별 지식베이스 ────────────────────────────────────────────────────────

export interface ProductKnowledge {
  id: string
  product_name: string
  category: string | null
  manufacturer: string | null
  manufacturer_contact: string | null
  as_info: string | null
  cautions: string | null
  application_notes: string | null
  contraindications: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProductKnowledgeWithStats extends ProductKnowledge {
  service_count: number
}

export type UpsertProductKnowledgeInput = Omit<ProductKnowledge, 'id' | 'created_by' | 'created_at' | 'updated_at'>

export async function getProductKnowledgeList(): Promise<{
  success: boolean
  items?: ProductKnowledgeWithStats[]
  error?: string
}> {
  return withStaffPermission(async () => {
    try {

      const supabase = createAdminClient()

      const [knowledgeResult, serviceResult] = await Promise.all([
        (supabase as any).from('eval_product_knowledge').select('*').order('product_name'),
        (supabase as any)
          .from('eval_service_records')
          .select('product_name')
          .not('product_name', 'is', null)
          .not('product_name', 'eq', ''),
      ])

      if (knowledgeResult.error) return { success: false, error: '조회에 실패했습니다' }

      // Count services per product name
      const serviceCountMap: Record<string, number> = {}
      ;(serviceResult.data ?? []).forEach((r: any) => {
        if (r.product_name) serviceCountMap[r.product_name] = (serviceCountMap[r.product_name] ?? 0) + 1
      })

      // Merge known products from service records without knowledge entries
      const existingNames = new Set((knowledgeResult.data ?? []).map((k: any) => k.product_name))
      const fromServices: ProductKnowledgeWithStats[] = Object.keys(serviceCountMap)
        .filter((name) => !existingNames.has(name))
        .map((name) => ({
          id: '',
          product_name: name,
          category: null,
          manufacturer: null,
          manufacturer_contact: null,
          as_info: null,
          cautions: null,
          application_notes: null,
          contraindications: null,
          created_by: null,
          created_at: '',
          updated_at: '',
          service_count: serviceCountMap[name] ?? 0,
        }))

      const withStats: ProductKnowledgeWithStats[] = [
        ...(knowledgeResult.data ?? []).map((k: any) => ({
          ...k,
          service_count: serviceCountMap[k.product_name] ?? 0,
        })),
        ...fromServices,
      ].sort((a, b) => b.service_count - a.service_count)

      return { success: true, items: withStats }
    } catch (error) {
      console.error('getProductKnowledgeList:', error)
      return { success: false, error: '예상치 못한 오류가 발생했습니다' }
    }
  })
}

export async function upsertProductKnowledge(input: UpsertProductKnowledgeInput): Promise<{
  success: boolean
  item?: ProductKnowledge
  error?: string
}> {
  return withStaffPermission(async () => {
    try {

      const { userId } = await auth()
      const supabase = createAdminClient()

      const { data, error } = await (supabase as any)
        .from('eval_product_knowledge')
        .upsert(
          { ...input, created_by: userId, updated_at: new Date().toISOString() },
          { onConflict: 'product_name', ignoreDuplicates: false }
        )
        .select()
        .single()

      if (error) return { success: false, error: '저장에 실패했습니다' }

      revalidatePath('/knowledge')
      return { success: true, item: data }
    } catch (error) {
      console.error('upsertProductKnowledge:', error)
      return { success: false, error: '예상치 못한 오류가 발생했습니다' }
    }
  })
}

export async function deleteProductKnowledge(id: string): Promise<{
  success: boolean
  error?: string
}> {
  return withStaffPermission(async () => {
    try {

      const supabase = createAdminClient()
      const { error } = await (supabase as any)
        .from('eval_product_knowledge')
        .delete()
        .eq('id', id)

      if (error) return { success: false, error: '삭제에 실패했습니다' }

      revalidatePath('/knowledge')
      return { success: true }
    } catch (error) {
      console.error('deleteProductKnowledge:', error)
      return { success: false, error: '예상치 못한 오류가 발생했습니다' }
    }
  })
}
