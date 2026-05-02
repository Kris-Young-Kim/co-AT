import { getAnnualTarget, upsertAnnualTarget } from '@/actions/annual-target-actions'
import { TargetForm } from '@/stats/components/targets/TargetForm'
import { YearSelector } from '@/stats/components/stats/YearSelector'

interface TargetsPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function TargetsPage({ searchParams }: TargetsPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const result = await getAnnualTarget(year)
  const target = result.success ? result.target ?? null : null

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">연도별 목표 관리</h1>
        <YearSelector currentYear={year} />
      </div>

      <div className="bg-white border rounded-lg p-6 max-w-lg">
        <h2 className="font-semibold text-gray-900 mb-4">{year}년 목표값</h2>
        <TargetForm
          year={year}
          defaultValues={target}
          onSubmit={upsertAnnualTarget}
        />
      </div>
    </div>
  )
}
