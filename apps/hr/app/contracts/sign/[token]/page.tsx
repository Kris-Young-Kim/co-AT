import { getContractByToken } from '@/actions/contract-actions'
import { EmployeeSignForm } from '@/components/contracts/EmployeeSignForm'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  params: Promise<{ token: string }>
}

const EMPLOYMENT_LABEL: Record<string, string> = {
  full_time: '정규직', part_time: '시간제', contract: '계약직', daily: '일용직',
}
const CONTRACT_LABEL: Record<string, string> = {
  initial: '최초 계약', renewal: '갱신 계약', amendment: '변경 계약',
}

export default async function ContractSignPage({ params }: Props) {
  const { token } = await params
  const result = await getContractByToken(token)

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-sm w-full text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">유효하지 않은 링크</h1>
          <p className="text-sm text-gray-500">서명 링크가 만료되었거나 올바르지 않습니다.</p>
        </div>
      </div>
    )
  }

  const contract = result.data

  if (contract.status === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-sm w-full text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">서명이 완료되었습니다</h1>
          <p className="text-sm text-gray-500">근로계약서 전자서명 절차가 모두 완료되었습니다.</p>
        </div>
      </div>
    )
  }

  if (contract.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-sm w-full text-center">
          <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">취소된 계약서</h1>
          <p className="text-sm text-gray-500">이 계약서는 취소되었습니다. 담당자에게 문의하세요.</p>
        </div>
      </div>
    )
  }

  if (contract.status === 'employee_signed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-sm w-full text-center">
          <CheckCircle2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">서명이 접수되었습니다</h1>
          <p className="text-sm text-gray-500">담당자 확인 후 최종 완료됩니다.</p>
        </div>
      </div>
    )
  }

  const employeeName = (contract.employee as { name?: string } | null)?.name ?? '—'

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">GWATC 인사관리시스템</p>
          <h1 className="text-2xl font-bold text-gray-900">근로계약서 전자서명</h1>
        </div>

        {/* 계약 정보 */}
        <div className="bg-white border rounded-2xl p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-800 border-b pb-2">계약 내용</h2>
          <dl className="space-y-2 text-sm">
            {[
              ['성명',       employeeName],
              ['부서',       contract.department],
              ['직위',       contract.position],
              ['계약 유형',  CONTRACT_LABEL[contract.contract_type] ?? contract.contract_type],
              ['고용형태',   EMPLOYMENT_LABEL[contract.employment_type] ?? contract.employment_type],
              ['계약 시작일', contract.start_date],
              ['계약 종료일', contract.end_date ?? '기간 없음 (무기한)'],
              ['기본급',     contract.base_salary > 0 ? `${contract.base_salary.toLocaleString('ko-KR')}원` : '—'],
              ['소정근로시간', `주 ${contract.work_hours}시간`],
            ].map(([dt, dd]) => (
              <div key={dt} className="flex gap-3">
                <dt className="w-24 shrink-0 text-gray-500">{dt}</dt>
                <dd className="text-gray-800 font-medium">{dd}</dd>
              </div>
            ))}
          </dl>
          {contract.note && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-1">비고</p>
              <p className="text-sm text-gray-700">{contract.note}</p>
            </div>
          )}
        </div>

        {/* 서명 폼 */}
        <div className="bg-white border rounded-2xl p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">서명</h2>
          <p className="text-sm text-gray-600 mb-4">
            위 계약 내용을 확인하였으며 동의합니다. 아래에 서명하여 주세요.
          </p>
          <EmployeeSignForm token={token} />
        </div>
      </div>
    </div>
  )
}
