import { listGrantReferralDocs } from '@/actions/grant-referral-actions'
import { ReferralDocForm } from '@/components/grant-eval/ReferralDocForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  searchParams: Promise<{ year?: string }>
}

export default async function ReferralDocsPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : new Date().getFullYear()

  const result = await listGrantReferralDocs(year)
  const docs = result.success ? result.docs ?? [] : []

  return (
    <div className="p-8">
      <Link href="/grant-eval" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        교부사업 평가 목록
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">접수공문 관리</h1>

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
            {docs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">접수공문이 없습니다</td>
              </tr>
            ) : (
              docs.map((doc) => (
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
    </div>
  )
}
