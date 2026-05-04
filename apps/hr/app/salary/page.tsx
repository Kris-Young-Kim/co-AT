import Link from 'next/link'
import { getDistinctSalaryMonths } from '@/actions/salary-actions'
import { Banknote } from 'lucide-react'

export default async function SalaryPage() {
  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const months = await getDistinctSalaryMonths()

  // Include current month if not already in list
  if (!months.includes(currentMonth)) months.unshift(currentMonth)

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">급여 관리</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Banknote className="w-4 h-4" />
          월별 급여 대장
        </div>
      </div>

      <div className="bg-white border rounded-lg divide-y">
        {months.map(m => (
          <Link key={m} href={`/salary/${m}`}
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
            <span className="font-medium">{m}</span>
            <span className="text-sm text-violet-600">조회 →</span>
          </Link>
        ))}
        {months.length === 0 && (
          <p className="px-5 py-8 text-center text-gray-400">급여 데이터가 없습니다.</p>
        )}
      </div>

      <Link href={`/salary/${currentMonth}`}
        className="block text-center bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700">
        {currentMonth} 급여 관리
      </Link>

      <div className="flex gap-3 text-sm">
        <Link href="/salary/grades" className="text-violet-600 hover:underline">호봉표 관리</Link>
        <span className="text-gray-300">|</span>
        <Link href="/salary/allowances" className="text-violet-600 hover:underline">수당 유형 설정</Link>
      </div>
    </div>
  )
}
