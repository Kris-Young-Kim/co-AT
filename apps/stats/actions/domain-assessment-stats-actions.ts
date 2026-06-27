'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'

export interface DomainAssessmentSummary {
  total: number
  thisMonth: number
  topDomain: string | null
  uniqueClients: number
}

export interface DomainCountStat {
  domain_type: string
  count: number
}

export interface MonthlyDomainStat {
  month: string   // YYYY-MM
  count: number
}

export interface ClientDomainCoverage {
  client_id: string
  client_name: string
  birth_date: string | null
  domain_count: number
  domains: string[]
}

export async function getDomainAssessmentSummary(): Promise<{
  success: boolean
  summary?: DomainAssessmentSummary
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const now = new Date()
  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data, error } = await (supabase as any)
    .from('domain_assessments')
    .select('id,domain_type,evaluation_date,client_id')

  if (error) return { success: false, error: '통계 조회에 실패했습니다' }

  const rows = (data ?? []) as Array<{ id: string; domain_type: string; evaluation_date: string; client_id: string | null }>
  const thisMonthRows = rows.filter(r => r.evaluation_date >= thisMonthStart)
  const clientIds = new Set(rows.map(r => r.client_id).filter(Boolean))

  const domainCounts: Record<string, number> = {}
  for (const r of rows) {
    domainCounts[r.domain_type] = (domainCounts[r.domain_type] ?? 0) + 1
  }
  const topDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    success: true,
    summary: {
      total: rows.length,
      thisMonth: thisMonthRows.length,
      topDomain,
      uniqueClients: clientIds.size,
    },
  }
}

export async function getDomainCountStats(): Promise<{
  success: boolean
  stats?: DomainCountStat[]
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from('domain_assessments')
    .select('domain_type')

  if (error) return { success: false, error: '통계 조회에 실패했습니다' }

  const counts: Record<string, number> = {}
  for (const r of (data ?? []) as Array<{ domain_type: string }>) {
    counts[r.domain_type] = (counts[r.domain_type] ?? 0) + 1
  }

  const ALL_DOMAINS = ['WC', 'ADL', 'S', 'SP', 'EC', 'CA', 'L', 'AAC', 'AM']
  const stats: DomainCountStat[] = ALL_DOMAINS.map(d => ({
    domain_type: d,
    count: counts[d] ?? 0,
  }))

  return { success: true, stats }
}

export async function getMonthlyDomainStats(months = 12): Promise<{
  success: boolean
  stats?: MonthlyDomainStat[]
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months + 1)
  cutoff.setDate(1)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const { data, error } = await (supabase as any)
    .from('domain_assessments')
    .select('evaluation_date')
    .gte('evaluation_date', cutoffStr)

  if (error) return { success: false, error: '통계 조회에 실패했습니다' }

  const counts: Record<string, number> = {}
  for (const r of (data ?? []) as Array<{ evaluation_date: string }>) {
    const month = r.evaluation_date.slice(0, 7)
    counts[month] = (counts[month] ?? 0) + 1
  }

  // Build month list from cutoff to now
  const result: MonthlyDomainStat[] = []
  const cur = new Date(cutoff)
  const end = new Date()
  while (cur <= end) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`
    result.push({ month: key, count: counts[key] ?? 0 })
    cur.setMonth(cur.getMonth() + 1)
  }

  return { success: true, stats: result }
}

export async function getTopClientsByDomainCount(limit = 10): Promise<{
  success: boolean
  clients?: ClientDomainCoverage[]
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from('domain_assessments')
    .select('client_id,domain_type')
    .not('client_id', 'is', null)

  if (error) return { success: false, error: '통계 조회에 실패했습니다' }

  // Aggregate by client
  const clientDomains = new Map<string, Set<string>>()
  for (const r of (data ?? []) as Array<{ client_id: string; domain_type: string }>) {
    if (!r.client_id) continue
    if (!clientDomains.has(r.client_id)) clientDomains.set(r.client_id, new Set())
    clientDomains.get(r.client_id)!.add(r.domain_type)
  }

  const sorted = [...clientDomains.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, limit)

  if (sorted.length === 0) return { success: true, clients: [] }

  const clientIds = sorted.map(([id]) => id)
  const { data: clientRows } = await (supabase as any)
    .from('clients')
    .select('id,name,birth_date')
    .in('id', clientIds)

  const clientInfo = new Map<string, { name: string; birth_date: string | null }>(
    ((clientRows ?? []) as Array<{ id: string; name: string; birth_date: string | null }>)
      .map(c => [c.id, { name: c.name, birth_date: c.birth_date }])
  )

  const clients: ClientDomainCoverage[] = sorted.map(([clientId, domains]) => ({
    client_id: clientId,
    client_name: clientInfo.get(clientId)?.name ?? '—',
    birth_date: clientInfo.get(clientId)?.birth_date ?? null,
    domain_count: domains.size,
    domains: [...domains],
  }))

  return { success: true, clients }
}
