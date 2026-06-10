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

const SERVICE_FLAGS = [
  { flag: 'is_rental',      label: '대여' },
  { flag: 'is_custom_make', label: '보조기기 맞춤 제작 지원' },
  { flag: 'is_grant',       label: '교부사업 맞춤형 평가지원' },
  { flag: 'is_cleaning',    label: '보조기기 소독 및 세척' },
  { flag: 'is_repair',      label: '보조기기 점검 및 수리' },
  { flag: 'is_reuse',       label: '보조기기 재사용 지원' },
] as const

type ServiceFlag = typeof SERVICE_FLAGS[number]['flag']

type ServiceRecord = {
  client_id: string | null
  service_area: string | null
  is_rental: boolean | null
  is_custom_make: boolean | null
  is_grant: boolean | null
  is_cleaning: boolean | null
  is_repair: boolean | null
  is_reuse: boolean | null
}

export default async function BusinessPage({ searchParams }: BusinessPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) redirect('/')

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('eval_service_records')
    .select('client_id, service_area, is_rental, is_custom_make, is_grant, is_cleaning, is_repair, is_reuse')
    .eq('application_year', year)

  const records = (data ?? []) as ServiceRecord[]

  const rows: DomainRow[] = SERVICE_FLAGS.map(({ flag, label }) => {
    const filtered = records.filter(r => r[flag as ServiceFlag] === true)

    const byDomain: Partial<Record<Domain, number>> = {}
    for (const d of DOMAINS) {
      const count = filtered.filter(r => r.service_area === d).length
      if (count > 0) byDomain[d] = count
    }

    const uniqueClients = new Set(
      filtered.map(r => r.client_id).filter((id): id is string => id !== null)
    ).size

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
