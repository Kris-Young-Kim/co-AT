import { getCallLogs } from '@/actions/call-log-actions'
import { CallLogTable } from '@/eval/components/eval/CallLogTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface CallLogsPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function CallLogsPage({ searchParams }: CallLogsPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const result = await getCallLogs({ year, limit: 200 })
  const logs = result.success ? result.logs ?? [] : []
  const total = result.success ? result.total ?? 0 : 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">콜센터 상담 일지</h1>
          <p className="text-sm text-gray-500 mt-1">{year}년 총 {total}건</p>
        </div>
        <Link
          href="/call-logs/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          상담 등록
        </Link>
      </div>

      {/* 연도 필터 */}
      <form method="GET" className="flex gap-3 mb-6">
        <select
          name="year"
          defaultValue={year}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          {[2026, 2025, 2024, 2023].map(y => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900"
        >
          조회
        </button>
      </form>

      <CallLogTable logs={logs} />
    </div>
  )
}
