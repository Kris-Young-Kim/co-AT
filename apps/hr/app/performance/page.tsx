import { EvaluationManager } from '@/components/performance/EvaluationManager'
import { getEvaluations } from '@/actions/evaluation-actions'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type { HrEmployee } from '@co-at/types'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ year?: string; period?: string }> }

export default async function PerformancePage({ searchParams }: Props) {
  const sp     = await searchParams
  const year   = Number(sp.year ?? new Date().getFullYear())
  const period = sp.period ?? ''

  const supabase   = createSupabaseAdmin()
  const { data: empData } = await supabase
    .from('hr_employees')
    .select('id,name,department,position')
    .eq('is_active', true)
    .order('name')

  const employees = (empData ?? []) as Pick<HrEmployee, 'id' | 'name' | 'department' | 'position'>[]

  const result = await getEvaluations(year, period || undefined)
  const evals  = result.success ? result.data : []

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">인사평가</h1>
        <p className="text-sm text-gray-500 mt-1">연간 중간·연말 인사평가 관리</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <form method="get" className="flex items-center gap-3">
          <select
            name="year"
            defaultValue={year}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            onChange={e => { const f = e.currentTarget.form; if (f) f.submit() }}
          >
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select
            name="period"
            defaultValue={period}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            onChange={e => { const f = e.currentTarget.form; if (f) f.submit() }}
          >
            <option value="">전체</option>
            <option value="mid">중간평가</option>
            <option value="year_end">연말평가</option>
          </select>
        </form>

        <div className="ml-auto flex items-center gap-4 text-sm text-gray-500">
          <span>총 <strong className="text-gray-900">{evals.length}</strong>건</span>
          <span>확정 <strong className="text-green-700">{evals.filter(e => e.status === 'confirmed').length}</strong>건</span>
        </div>
      </div>

      {!result.success && (
        <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{result.error}</div>
      )}

      <EvaluationManager initialEvals={evals} employees={employees} year={year} />
    </div>
  )
}
