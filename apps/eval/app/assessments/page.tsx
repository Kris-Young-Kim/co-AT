import { getAllDomainAssessments } from '@/actions/assessment-actions'
import Link from 'next/link'
import { ClipboardList, ExternalLink } from 'lucide-react'

const DOMAIN_LABELS: Record<string, string> = {
  WC: '휠체어 및 이동',
  ADL: '일상생활동작',
  S: '감각',
  SP: '앉기 및 자세',
  EC: '주택 및 환경개조',
  CA: '컴퓨터접근',
  L: '레저',
  AAC: '보완대체의사소통',
  AM: '자동차개조',
}

const DOMAIN_COLORS: Record<string, string> = {
  WC: 'bg-blue-50 text-blue-700',
  ADL: 'bg-green-50 text-green-700',
  S: 'bg-yellow-50 text-yellow-700',
  SP: 'bg-purple-50 text-purple-700',
  EC: 'bg-orange-50 text-orange-700',
  CA: 'bg-cyan-50 text-cyan-700',
  L: 'bg-pink-50 text-pink-700',
  AAC: 'bg-indigo-50 text-indigo-700',
  AM: 'bg-red-50 text-red-700',
}

export default async function AssessmentsPage() {
  const result = await getAllDomainAssessments()
  const assessments = result.success ? (result.assessments ?? []) : []

  // 대상자별 그룹화
  const byClient = new Map<string, typeof assessments>()
  for (const a of assessments) {
    const key = a.client_id
    if (!byClient.has(key)) byClient.set(key, [])
    byClient.get(key)!.push(a)
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold">영역별 평가 목록</h1>
          <p className="text-sm text-gray-500 mt-0.5">전체 {assessments.length}건</p>
        </div>
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">등록된 평가가 없습니다</p>
          <p className="text-xs mt-1">대상자 → 신청서 → 평가하기에서 작성하세요</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(byClient.entries()).map(([clientId, items]) => {
            const first = items[0]
            const appId = first.application_id
            return (
              <div key={clientId} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                  <div>
                    <span className="font-semibold text-sm">{first.client_name}</span>
                    {first.birth_date && (
                      <span className="ml-2 text-xs text-gray-500">{first.birth_date}</span>
                    )}
                    {first.disability_type && (
                      <span className="ml-2 text-xs text-gray-400">{first.disability_type}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{items.length}/9 영역 완료</span>
                    <Link
                      href={`/clients/${clientId}/applications/${appId}/assessment`}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                      평가하기
                    </Link>
                  </div>
                </div>
                <div className="divide-y">
                  {items.map((a) => (
                    <Link
                      key={a.id}
                      href={`/clients/${a.client_id}/applications/${a.application_id}/assessment?domain=${a.domain_type}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${DOMAIN_COLORS[a.domain_type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {a.domain_type}
                      </span>
                      <span className="text-sm flex-1">{DOMAIN_LABELS[a.domain_type] ?? a.domain_type}</span>
                      <span className="text-xs text-gray-400">{a.evaluation_date}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
