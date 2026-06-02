export const dynamic = 'force-dynamic'

import { getEducationRecords } from '@/actions/education-actions'
import { GraduationCap } from 'lucide-react'

const DOMAIN_LABELS: Record<string, string> = {
  WC: 'WC (휠체어·이동)',
  ADL: 'ADL (일상생활)',
  S: 'S (감각)',
  SP: 'SP (앉기·자세)',
  EC: 'EC (환경개조)',
  CA: 'CA (컴퓨터접근)',
  L: 'L (레저)',
  AAC: 'AAC (보완대체의사소통)',
  AM: 'AM (자동차개조)',
  미분류: '미분류',
}

interface Props {
  searchParams: Promise<{ year?: string; month?: string; domain?: string }>
}

export default async function EducationPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : new Date().getFullYear()
  const month = params.month ? parseInt(params.month) : undefined
  const domain = params.domain || undefined

  const result = await getEducationRecords({ year, month, domain })
  const records = result.success ? result.records : []
  const domainStats = result.success ? result.domainStats : []

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">이용자 교육 이력</h1>
      </div>

      {/* Domain summary cards */}
      {domainStats.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {domainStats.map(s => (
            <div key={s.domain} className="bg-indigo-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-indigo-700">{s.count}</p>
              <p className="text-xs text-gray-600 mt-0.5">{DOMAIN_LABELS[s.domain] ?? s.domain}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <form method="GET" className="flex gap-3 flex-wrap">
        <select name="year" defaultValue={year} className="px-3 py-2 border rounded-md text-sm focus:outline-none">
          {[2026, 2025, 2024, 2023].map(y => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <select name="month" defaultValue={month ?? ''} className="px-3 py-2 border rounded-md text-sm focus:outline-none">
          <option value="">전체 월</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>
        <select name="domain" defaultValue={domain ?? ''} className="px-3 py-2 border rounded-md text-sm focus:outline-none">
          <option value="">전체 영역</option>
          {Object.entries(DOMAIN_LABELS).filter(([k]) => k !== '미분류').map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900">
          조회
        </button>
      </form>

      <p className="text-sm text-gray-500">총 {records.length}건</p>

      {records.length === 0 ? (
        <div className="border rounded-lg px-4 py-12 text-center text-sm text-gray-400 bg-gray-50">
          해당 조건에 교육 이력이 없습니다
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">접수일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">성명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">서비스 영역</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">내용</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">담당자</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.received_at ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {r.service_area ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {r.service_area}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{r.service_content ?? '—'}</td>
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
