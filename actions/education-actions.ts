'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface EducationRecord {
  id: string
  received_at: string | null
  application_year: number | null
  application_month: number | null
  name: string | null
  service_area: string | null
  service_content: string | null
  staff_name: string | null
  client_id: string | null
  application_id: string | null
}

export interface EducationDomainStat {
  domain: string
  count: number
}

export async function getEducationRecords(filters?: {
  year?: number
  month?: number
  domain?: string
}): Promise<{ success: true; records: EducationRecord[]; domainStats: EducationDomainStat[] } | { success: false; error: string }> {
  try {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('eval_service_records')
      .select('id, received_at, application_year, application_month, name, service_area, service_content, staff_name, client_id, application_id')
      .eq('is_education', true)
      .order('received_at', { ascending: false })

    if (filters?.year) query = query.eq('application_year', filters.year)
    if (filters?.month) query = query.eq('application_month', filters.month)
    if (filters?.domain) query = query.eq('service_area', filters.domain)

    const { data, error } = await query
    if (error) return { success: false, error: error.message }

    const records = (data ?? []) as EducationRecord[]

    // domain breakdown (from unfiltered by domain for summary)
    const domainMap: Record<string, number> = {}
    for (const r of records) {
      const d = r.service_area ?? '미분류'
      domainMap[d] = (domainMap[d] ?? 0) + 1
    }
    const domainStats: EducationDomainStat[] = Object.entries(domainMap)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)

    return { success: true, records, domainStats }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
