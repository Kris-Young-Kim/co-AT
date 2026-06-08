export const dynamic = 'force-dynamic'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { CalendarDays } from 'lucide-react'

interface Props {
  searchParams: Promise<{ month?: string }>
}

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const LEAVE_COLORS: Record<string, string> = {
  annual:  'bg-violet-100 text-violet-700',
  sick:    'bg-blue-100 text-blue-700',
  special: 'bg-amber-100 text-amber-700',
  unpaid:  'bg-gray-100 text-gray-600',
}

export default async function LeaveCalendarPage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const month = params.month ?? defaultMonth

  const [year, mon] = month.split('-').map(Number)
  const daysInMonth = new Date(year, mon, 0).getDate()
  const firstDow = new Date(year, mon - 1, 1).getDay()

  const supabase = createSupabaseAdmin()
  const { data: leaves } = await supabase
    .from('hr_leave_requests')
    .select('employee_id, leave_type, start_date, end_date, hr_employees(name)')
    .eq('status', 'approved')
    .lte('start_date', `${month}-${String(daysInMonth).padStart(2, '0')}`)
    .gte('end_date', `${month}-01`)

  type Leave = { employee_id: string; leave_type: string; start_date: string; end_date: string; hr_employees: { name: string } | null }

  // 날짜 → 직원 목록 매핑
  const dayMap = new Map<number, { name: string; type: string }[]>()
  for (const lv of (leaves ?? []) as unknown as Leave[]) {
    const start = new Date(lv.start_date)
    const end = new Date(lv.end_date)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() !== year || d.getMonth() + 1 !== mon) continue
      const day = d.getDate()
      const list = dayMap.get(day) ?? []
      list.push({ name: lv.hr_employees?.name ?? '—', type: lv.leave_type })
      dayMap.set(day, list)
    }
  }

  const months: string[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const nextM = new Date(year, mon, 1)
  const nextMonth = `${nextM.getFullYear()}-${String(nextM.getMonth() + 1).padStart(2, '0')}`
  const prevM = new Date(year, mon - 2, 1)
  const prevMonth = `${prevM.getFullYear()}-${String(prevM.getMonth() + 1).padStart(2, '0')}`

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">휴가 캘린더</h1>
        </div>
        <div className="flex items-center gap-2">
          <a href={`?month=${prevMonth}`} className="border rounded px-2 py-1 text-sm hover:bg-gray-50">‹</a>
          <span className="font-semibold text-sm">{year}년 {mon}월</span>
          <a href={`?month=${nextMonth}`} className="border rounded px-2 py-1 text-sm hover:bg-gray-50">›</a>
        </div>
      </div>

      <div className="flex gap-3 text-xs">
        {Object.entries(LEAVE_COLORS).map(([type, cls]) => (
          <span key={type} className={`px-2 py-0.5 rounded ${cls}`}>
            {{ annual: '연차', sick: '병가', special: '특별', unpaid: '무급' }[type]}
          </span>
        ))}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7">
          {DOW_LABELS.map(d => (
            <div key={d} className={`text-center py-2 text-xs font-semibold border-b ${d === '일' ? 'text-red-500' : d === '토' ? 'text-blue-500' : 'text-gray-500'}`}>
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            const isToday = day !== null && today.getFullYear() === year && today.getMonth() + 1 === mon && today.getDate() === day
            const dow = i % 7
            const isSun = dow === 0
            const isSat = dow === 6
            const dayLeaves = day ? (dayMap.get(day) ?? []) : []

            return (
              <div
                key={i}
                className={`min-h-[90px] border-b border-r p-1.5 ${!day ? 'bg-gray-50/50' : ''} ${isToday ? 'bg-violet-50' : ''}`}
              >
                {day && (
                  <>
                    <p className={`text-xs font-medium mb-1 ${isToday ? 'text-violet-700' : isSun ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-gray-700'}`}>
                      {day}
                    </p>
                    <div className="space-y-0.5">
                      {dayLeaves.slice(0, 3).map((lv, j) => (
                        <div key={j} className={`text-xs px-1 py-0.5 rounded truncate ${LEAVE_COLORS[lv.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {lv.name}
                        </div>
                      ))}
                      {dayLeaves.length > 3 && (
                        <div className="text-xs text-gray-400 px-1">+{dayLeaves.length - 3}명</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
