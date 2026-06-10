import { listGrantReferralDocs } from '@/actions/grant-referral-actions'
import { listApprovalGrantDocs } from '@/actions/grant-referral-actions'
import { ReferralDocForm } from '@/eval/components/grant-eval/ReferralDocForm'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'

interface Props {
  searchParams: Promise<{ year?: string }>
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft:    { label: '임시저장', className: 'bg-gray-100 text-gray-500' },
  pending:  { label: '결재 중',  className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인완료', className: 'bg-green-100 text-green-700' },
  rejected: { label: '반려',     className: 'bg-red-100 text-red-600' },
}

export default async function ReferralDocsPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : new Date().getFullYear()

  const [approvalResult, manualResult] = await Promise.all([
    listApprovalGrantDocs(year),
    listGrantReferralDocs(year),
  ])

  const approvalDocs = approvalResult.success ? approvalResult.docs ?? [] : []
  const manualDocs   = manualResult.success   ? manualResult.docs ?? []   : []

  const approvalAppUrl = process.env.NEXT_PUBLIC_APPROVAL_APP_URL ?? '#'

  return (
    <div className="p-8 space-y-8">
      <div>
        <Link href="/grant-eval" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          교부사업 평가 목록
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">접수공문 관리</h1>
          <Link
            href={`${approvalAppUrl}/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Approval 앱에서 공문 기안
          </Link>
        </div>
      </div>

      {/* ── Approval 앱 연동 공문 ─────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">결재 처리 공문 (Approval 앱)</h2>
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">공문번호</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">발송기관</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">접수일</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">의뢰 건수</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">결재 상태</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">공문명</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {approvalDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    {approvalResult.success
                      ? '등록된 결재 공문이 없습니다. 위 버튼으로 Approval 앱에서 기안하세요.'
                      : `조회 실패: ${approvalResult.error}`}
                  </td>
                </tr>
              ) : (
                approvalDocs.map((doc) => {
                  const badge = STATUS_BADGE[doc.status] ?? { label: doc.status, className: 'bg-gray-100 text-gray-500' }
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{doc.content.doc_number ?? '—'}</td>
                      <td className="px-4 py-3 font-medium">{doc.content.sending_org}</td>
                      <td className="px-4 py-3 text-gray-600">{doc.content.receive_date ?? '—'}</td>
                      <td className="px-4 py-3 text-center">{doc.content.referral_count ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <Link
                          href={`${approvalAppUrl}/${doc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-blue-600 hover:underline"
                        >
                          {doc.title}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 수기 등록 공문 ─────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">수기 등록 공문</h2>

        <ReferralDocForm />

        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">공문번호</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">발송기관</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">접수일</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">의뢰 건수</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">평가 건수</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">취소</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">결과 발송일</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {manualDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">수기 등록된 공문이 없습니다</td>
                </tr>
              ) : (
                manualDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{doc.doc_number ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">{doc.sending_org}</td>
                    <td className="px-4 py-3 text-gray-600">{doc.receive_date ?? '—'}</td>
                    <td className="px-4 py-3 text-center">{doc.referral_count}</td>
                    <td className="px-4 py-3 text-center">{doc.assessment_count}</td>
                    <td className="px-4 py-3 text-center">{doc.cancel_count}</td>
                    <td className="px-4 py-3 text-gray-600">{doc.result_send_date ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
