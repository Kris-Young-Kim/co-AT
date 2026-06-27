import { getAssessmentSessions } from '@/actions/assessment-actions'
import Link from 'next/link'
import { ClipboardCheck } from 'lucide-react'

const DOMAIN_COLORS: Record<string, string> = {
  WC: 'bg-blue-100 text-blue-700',
  ADL: 'bg-green-100 text-green-700',
  S: 'bg-yellow-100 text-yellow-700',
  SP: 'bg-purple-100 text-purple-700',
  EC: 'bg-orange-100 text-orange-700',
  CA: 'bg-cyan-100 text-cyan-700',
  L: 'bg-pink-100 text-pink-700',
  AAC: 'bg-indigo-100 text-indigo-700',
  AM: 'bg-red-100 text-red-700',
}

export default async function AssessmentSessionsPage() {
  const result = await getAssessmentSessions()
  const sessions = result.success ? (result.sessions ?? []) : []

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 세션 목록</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            상담기록지 기준 전체 평가 세션 — {sessions.length}건
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <ClipboardCheck className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">평가 세션이 없습니다</p>
          <p className="text-xs mt-1">대상자 페이지에서 상담 및 평가를 시작하세요</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">상담일</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">대상자</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">유형</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">상담사</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">평가 영역</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map(session => (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                    {session.consultation_date}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${session.client_id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {session.client_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{session.consultation_type}</td>
                  <td className="px-4 py-3 text-gray-500">{session.consultant ?? '—'}</td>
                  <td className="px-4 py-3">
                    {session.domain_types.length === 0 ? (
                      <span className="text-xs text-gray-400">없음</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {session.domain_types.map(d => (
                          <span
                            key={d}
                            className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${DOMAIN_COLORS[d] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/clients/${session.client_id}/sessions/${session.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      상세 보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
