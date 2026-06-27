import { listApprovalGrantDocs } from '@/actions/grant-referral-actions'
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

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

export default async function ReferralDocsPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : CURRENT_YEAR

  const result = await listApprovalGrantDocs(year)
  const docs = result.success ? result.docs ?? [] : []

  const approvalAppUrl = process.env.NEXT_PUBLIC_APPROVAL_APP_URL ?? '#'

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href="/grant-eval" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          교부사업 평가 목록
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">교부사업 평가 의뢰 공문</h1>

          {/* Year filter */}
          <div className="flex gap-1">
            {YEAR_OPTIONS.map((y) => (
              <Link
                key={y}
                href={`?year=${y}`}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  y === year
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {y}년
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Approval 앱에서 접수된 교부사업 평가 의뢰 공문 목록입니다.
        </p>
      </div>

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
            {docs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  {result.success
                    ? `${year}년 교부사업 평가 의뢰 공문이 없습니다`
                    : `조회 실패: ${result.error}`}
                </td>
              </tr>
            ) : (
              docs.map((doc) => {
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
    </div>
  )
}
