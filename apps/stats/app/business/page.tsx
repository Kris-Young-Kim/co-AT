import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { BusinessDomainTable, type DomainRow } from '@/stats/components/stats/BusinessDomainTable'
import { YearSelector } from '@/stats/components/stats/YearSelector'
import { redirect } from 'next/navigation'

interface BusinessPageProps {
  searchParams: Promise<{ year?: string }>
}

const DOMAINS = ['WC','ADL','S','SP','EC','CA','L','AAC','AM'] as const
type Domain = typeof DOMAINS[number]

const SERVICE_ROWS = [
  { key: 'rental',       label: '대여' },
  { key: 'custom_make',  label: '보조기기 맞춤 제작 지원' },
  { key: 'assessment',   label: '교부사업 맞춤형 평가지원' },
  { key: 'cleaning',     label: '보조기기 소독 및 세척' },
  { key: 'repair',       label: '보조기기 점검 및 수리' },
  { key: 'reuse',        label: '보조기기 재사용 지원' },
]

export default async function BusinessPage({ searchParams }: BusinessPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) redirect('/')

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('applications')
    .select('sub_category, domain, client_id, status')
    .gte('created_at', `${year}-01-01`)
    .lte('created_at', `${year}-12-31`)

  const apps = data ?? []

  const rows: DomainRow[] = SERVICE_ROWS.map(({ key, label }) => {
    const filtered = apps.filter(a => a.sub_category === key)
    const byDomain: Partial<Record<Domain, number>> = {}
    for (const d of DOMAINS) {
      const cnt = filtered.filter(a => a.domain === d).length
      if (cnt > 0) byDomain[d] = cnt
    }
    const uniqueClients = new Set(filtered.map(a => a.client_id).filter(Boolean)).size
    return {
      label,
      total: filtered.length,
      byDomain,
      actual_persons: uniqueClients,
      extended_persons: filtered.length,
    }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">사업별 현황</h1>
        <YearSelector currentYear={year} />
      </div>
      <BusinessDomainTable rows={rows} />
    </div>
  )
}
