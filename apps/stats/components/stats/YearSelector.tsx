'use client'

import { useRouter, usePathname } from 'next/navigation'

export function YearSelector({ currentYear, from = 2023 }: { currentYear: number; from?: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: thisYear - from + 1 }, (_, i) => thisYear - i)

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">연도</span>
      <select
        value={currentYear}
        onChange={e => router.push(`${pathname}?year=${e.target.value}`)}
        className="px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {years.map(y => <option key={y} value={y}>{y}년</option>)}
      </select>
    </div>
  )
}
