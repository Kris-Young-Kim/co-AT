import { getServiceRecords } from '@/actions/service-record-actions'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function ServiceRecordsPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : new Date().getFullYear()
  const month = params.month ? parseInt(params.month) : undefined

  const result = await getServiceRecords({ year, month })
  const records = result.success ? result.records ?? [] : []

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">서비스 기록</h1>
        <p className="text-sm text-gray-500 mt-1">총 {records.length}건</p>
      </div>

      {/* 필터 */}
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
        <select
          name="month"
          defaultValue={month ?? ''}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          <option value="">전체 월</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900"
        >
          조회
        </button>
      </form>

      {records.length === 0 ? (
        <div className="border rounded-lg px-4 py-12 text-center text-sm text-gray-400 bg-gray-50">
          해당 기간에 서비스 기록이 없습니다
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">접수일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">성명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">서비스 대분류</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">서비스 내용</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">담당자</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {records.map(r => (
                <tr
                  key={r.id}
                  className={r.client_id && r.application_id ? 'hover:bg-gray-50 cursor-pointer' : ''}
                >
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {r.client_id && r.application_id ? (
                      <Link
                        href={`/clients/${r.client_id}/applications/${r.application_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {r.received_at ?? '—'}
                      </Link>
                    ) : (
                      r.received_at ?? '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.service_major_category ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{r.service_content ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.staff_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
