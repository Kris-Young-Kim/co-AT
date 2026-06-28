import { getAllDomainAssessments } from '@/actions/assessment-actions'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'

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

  // Group by client_id
  const byClient = new Map<string, typeof assessments>()
  for (const a of assessments) {
    const key = a.client_id ?? `app-${a.application_id}`
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
          <p className="text-xs mt-1">대상자 → 상담 및 평가 시작에서 작성하세요</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(byClient.entries()).map(([groupKey, items]) => {
            const first = items[0]
            const clientId = first.client_id
            const clientHref = clientId ? `/clients/${clientId}` : null

            // Group items by consultation_record_id within the client
            const byConsult = new Map<string, typeof items>()
            const standalone: typeof items = []
            for (const item of items) {
              if (item.consultation_record_id) {
                const g = byConsult.get(item.consultation_record_id) ?? []
                g.push(item)
                byConsult.set(item.consultation_record_id, g)
              } else {
                standalone.push(item)
              }
            }

            return (
              <div key={groupKey} className="border rounded-lg overflow-hidden">
                {/* Client header */}
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
                    <span>{items.length}건</span>
                    {clientHref && (
                      <Link
                        href={clientHref}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                      >
                        대상자 보기
                      </Link>
                    )}
                  </div>
                </div>

                <div className="divide-y">
                  {/* Consultation-linked groups */}
                  {Array.from(byConsult.entries()).map(([consultId, group]) => {
                    const href = clientId
                      ? `/clients/${clientId}/sessions/${consultId}`
                      : null
                    const innerContent = (
                      <>
                        <div className="shrink-0 pt-0.5">
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">상담</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            {group.map(a => (
                              <span
                                key={a.id}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${DOMAIN_COLORS[a.domain_type] ?? 'bg-gray-100 text-gray-600'}`}
                              >
                                {a.domain_type}
                                <span className="ml-1 font-normal opacity-70">{DOMAIN_LABELS[a.domain_type] ?? ''}</span>
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400">{group[0].evaluation_date}</p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{group.length}개 영역</span>
                      </>
                    )
                    const rowClass = "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    return href ? (
                      <Link key={consultId} href={href} className={rowClass}>{innerContent}</Link>
                    ) : (
                      <div key={consultId} className={rowClass}>{innerContent}</div>
                    )
                  })}

                  {/* Standalone (application-linked) */}
                  {standalone.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${DOMAIN_COLORS[a.domain_type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {a.domain_type}
                      </span>
                      <span className="text-sm flex-1 text-gray-600">{DOMAIN_LABELS[a.domain_type] ?? a.domain_type}</span>
                      <span className="text-xs text-gray-400">{a.evaluation_date}</span>
                    </div>
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
