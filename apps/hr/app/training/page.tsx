import { TrainingManager } from '@/components/training/TrainingManager'
import { getTrainings } from '@/actions/training-actions'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type { HrEmployee } from '@co-at/types'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ year?: string }> }

export default async function TrainingPage({ searchParams }: Props) {
  const sp   = await searchParams
  const year = Number(sp.year ?? new Date().getFullYear())

  const supabase = createSupabaseAdmin()
  const { data: empData } = await supabase
    .from('hr_employees')
    .select('id,name,department')
    .eq('is_active', true)
    .order('name')

  const employees = (empData ?? []) as Pick<HrEmployee, 'id' | 'name' | 'department'>[]

  const result    = await getTrainings(year)
  const trainings = result.success ? result.data : []

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const mandatoryCount = trainings.filter(t => t.category === 'mandatory').length

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">교육훈련 관리</h1>
        <p className="text-sm text-gray-500 mt-1">교육 이력 등록 및 참석자 관리</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '전체 교육', value: trainings.length, unit: '건', color: 'text-gray-900' },
          { label: '의무교육', value: mandatoryCount, unit: '건', color: 'text-red-700' },
          { label: '참여 직원', value: employees.length, unit: '명', color: 'text-violet-700' },
        ].map(card => (
          <div key={card.label} className="bg-white border rounded-xl px-5 py-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}<span className="text-sm font-normal ml-1">{card.unit}</span></p>
          </div>
        ))}
      </div>

      {/* Year Filter */}
      <div className="flex items-center gap-3">
        <form method="get">
          <select
            name="year"
            defaultValue={year}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            onChange={e => { const f = e.currentTarget.form; if (f) f.submit() }}
          >
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
        </form>
      </div>

      {!result.success && (
        <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{result.error}</div>
      )}

      <TrainingManager initialTrainings={trainings} employees={employees} />
    </div>
  )
}
