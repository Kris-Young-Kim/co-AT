"use server"

import { createClient } from "@/lib/supabase/server"

export interface ReusableDevice {
  id: string
  name: string
  category: string | null
  asset_code: string | null
  manufacturer: string | null
  model: string | null
  purchase_date: string | null
  status: string
  is_rental_available: boolean
}

/**
 * 재사용(기증) 가능한 기기 목록 조회
 * inventory 테이블에서 status가 '보관'이고 is_rental_available이 true인 기기들 조회
 */
export async function getReusableDevices(limit: number = 20): Promise<ReusableDevice[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("inventory")
    .select("id, name, category, asset_code, manufacturer, model, purchase_date, status, is_rental_available")
    .eq("status", "보관")
    .eq("is_rental_available", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("재사용 기기 조회 실패:", error)
    return []
  }

  return data || []
}

