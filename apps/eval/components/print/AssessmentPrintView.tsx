import type { AssessmentDomainType } from '@/eval/components/eval/DomainSelector'
import { DOMAIN_LABELS } from '@/eval/components/eval/DomainSelector'
import type { Client } from '@/actions/client-actions'

interface AssessmentRecord {
  id: string
  domain_type: AssessmentDomainType
  evaluation_date: string
  evaluator_opinion: string | null
  recommended_device: string | null
  future_plan: string | null
}

interface AssessmentPrintViewProps {
  assessment: AssessmentRecord
  client: Client
}

export function AssessmentPrintView({ assessment, client }: AssessmentPrintViewProps) {
  return (
    <div className="p-10 max-w-[800px] mx-auto font-sans text-sm">
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold">영역별 보조기기 평가서</h1>
        <p className="text-gray-500 mt-1">첨부 21 — {assessment.domain_type} ({DOMAIN_LABELS[assessment.domain_type]}) 영역</p>
      </div>

      <table className="w-full border-collapse border border-gray-400 mb-6">
        <tbody>
          <tr>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left w-32">성명</th>
            <td className="border border-gray-400 px-3 py-2">{client.name}</td>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left w-32">생년월일</th>
            <td className="border border-gray-400 px-3 py-2">{client.birth_date ?? '—'}</td>
          </tr>
          <tr>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left">평가 영역</th>
            <td className="border border-gray-400 px-3 py-2">
              {assessment.domain_type} — {DOMAIN_LABELS[assessment.domain_type]}
            </td>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left">평가일</th>
            <td className="border border-gray-400 px-3 py-2">{assessment.evaluation_date}</td>
          </tr>
        </tbody>
      </table>

      <div className="border border-gray-400 p-4 mb-4">
        <h3 className="font-semibold mb-2">평가자 의견</h3>
        <p className="whitespace-pre-wrap min-h-[100px]">{assessment.evaluator_opinion ?? ''}</p>
      </div>

      <div className="border border-gray-400 p-4 mb-4">
        <h3 className="font-semibold mb-2">추천 보조기기</h3>
        <p className="whitespace-pre-wrap min-h-[60px]">{assessment.recommended_device ?? ''}</p>
      </div>

      <div className="border border-gray-400 p-4 mb-6">
        <h3 className="font-semibold mb-2">향후 계획</h3>
        <p className="whitespace-pre-wrap min-h-[60px]">{assessment.future_plan ?? ''}</p>
      </div>

      <div className="flex justify-between items-end mt-8">
        <p className="text-gray-500">출력일: {new Date().toLocaleDateString('ko-KR')}</p>
        <div className="text-right">
          <p className="mb-8">평가자: _______________</p>
          <p>(서명 또는 인)</p>
        </div>
      </div>
    </div>
  )
}
