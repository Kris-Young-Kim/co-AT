"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

export type PipelineChannel = "web" | "chatbot" | "phone" | null

export interface PipelineCard {
  id: string
  client_id: string
  client_name: string
  status: string
  category: string | null
  sub_category: string | null
  created_at: string | null
  desired_date: string | null
  channel: PipelineChannel
}

export interface PipelineData {
  접수: PipelineCard[]
  배정: PipelineCard[]
  진행중: PipelineCard[]
  완료: PipelineCard[]
}

const ACTIVE_STATUSES = ["접수", "배정", "진행중", "완료"] as const

export async function getPipelineData(options?: {
  channel?: PipelineChannel | "all"
  daysBack?: number
}): Promise<{ success: boolean; data?: PipelineData; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const supabase = createAdminClient()

    // Build date filter
    let since: string | null = null
    const days = options?.daysBack ?? 90
    if (days > 0) {
      const d = new Date()
      d.setDate(d.getDate() - days)
      since = d.toISOString()
    }

    // Fetch applications with client name
    let query = (supabase as any)
      .from("applications")
      .select("id, status, category, sub_category, created_at, desired_date, client_id, clients!inner(name)")
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false })

    if (since) query = query.gte("created_at", since)

    const { data: apps, error: appsError } = await query
    if (appsError) return { success: false, error: appsError.message }

    const appList = (apps ?? []) as Array<{
      id: string
      status: string
      category: string | null
      sub_category: string | null
      created_at: string | null
      desired_date: string | null
      client_id: string
      clients: { name: string }
    }>

    // Fetch channels from call_logs for these application IDs
    const appIds = appList.map((a) => a.id)
    const channelMap: Record<string, PipelineChannel> = {}

    if (appIds.length > 0) {
      const { data: logs } = await (supabase as any)
        .from("call_logs")
        .select("application_id, channel")
        .in("application_id", appIds)

      for (const log of logs ?? []) {
        if (log.application_id && !channelMap[log.application_id]) {
          channelMap[log.application_id] = log.channel as PipelineChannel
        }
      }
    }

    // Build cards
    const cards: PipelineCard[] = appList.map((a) => ({
      id: a.id,
      client_id: a.client_id,
      client_name: a.clients?.name ?? "—",
      status: a.status,
      category: a.category,
      sub_category: a.sub_category,
      created_at: a.created_at,
      desired_date: a.desired_date,
      channel: channelMap[a.id] ?? null,
    }))

    // Apply channel filter
    const filtered =
      !options?.channel || options.channel === "all"
        ? cards
        : cards.filter((c) => c.channel === options.channel)

    // Group by status
    const data: PipelineData = { 접수: [], 배정: [], 진행중: [], 완료: [] }
    for (const card of filtered) {
      const key = card.status as keyof PipelineData
      if (key in data) data[key].push(card)
    }

    return { success: true, data }
  } catch (error) {
    console.error("getPipelineData:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}
