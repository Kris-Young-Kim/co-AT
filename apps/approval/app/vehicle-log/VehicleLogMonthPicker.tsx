'use client'

import { useRouter } from 'next/navigation'

interface Props {
  year: number
  month: number
}

export default function VehicleLogMonthPicker({ year, month }: Props) {
  const router = useRouter()

  function go(y: number, m: number) {
    if (m < 1)  { y -= 1; m = 12 }
    if (m > 12) { y += 1; m = 1  }
    router.push(`/vehicle-log?year=${y}&month=${m}`)
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={() => go(year, month - 1)} className="p-1 rounded hover:bg-gray-100 text-gray-500">‹</button>
      <select
        value={`${year}-${month}`}
        onChange={e => {
          const [y, m] = e.target.value.split('-').map(Number)
          router.push(`/vehicle-log?year=${y}&month=${m}`)
        }}
        className="border rounded-md px-3 py-1.5 text-sm"
      >
        {Array.from({ length: 12 }, (_, i) => {
          const m = i + 1
          return (
            <option key={m} value={`${year}-${m}`}>
              {year}년 {m}월
            </option>
          )
        })}
      </select>
      <button onClick={() => go(year, month + 1)} className="p-1 rounded hover:bg-gray-100 text-gray-500">›</button>
      <span className="text-sm text-gray-400">{year}년 {month}월</span>
    </div>
  )
}
