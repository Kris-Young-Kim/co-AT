'use client'

import type { HrEmployee, HrCareer, HrSalaryRecord, CertificateType } from '@co-at/types'

const CERT_LABELS: Record<CertificateType, string> = {
  employment:  '재  직  증  명  서',
  career:      '경  력  증  명  서',
  salary:      '급  여  확  인  서',
  resignation: '퇴  직  증  명  서',
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: '정규직',
  part_time: '파트타임',
  contract:  '계약직',
  daily:     '일용직',
}

export type CertificateData =
  | { type: 'employment';  employee: HrEmployee }
  | { type: 'career';      employee: HrEmployee; careers: HrCareer[] }
  | { type: 'salary';      employee: HrEmployee; record: HrSalaryRecord }
  | { type: 'resignation'; employee: HrEmployee }

interface Props {
  data: CertificateData
  purpose?: string
}

function formatKRW(n: number) { return n.toLocaleString('ko-KR') + '원' }

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-2 pr-8 text-gray-500 font-medium whitespace-nowrap">{label}</td>
      <td className="py-2">{value}</td>
    </tr>
  )
}

function CertBody({ data }: { data: CertificateData }) {
  const { employee } = data

  if (data.type === 'employment') {
    return (
      <>
        <table className="text-sm mb-8">
          <tbody>
            <Row label="성    명" value={employee.name} />
            <Row label="부    서" value={employee.department} />
            <Row label="직    책" value={employee.position} />
            <Row label="입 사 일" value={employee.hire_date} />
            <Row label="고용형태" value={EMPLOYMENT_LABELS[employee.employment_type] ?? employee.employment_type} />
          </tbody>
        </table>
        <p className="text-sm leading-relaxed">위 사람이 당 기관에 재직하고 있음을 증명합니다.</p>
      </>
    )
  }

  if (data.type === 'career') {
    return (
      <>
        <table className="text-sm mb-8">
          <tbody>
            <Row label="성    명" value={employee.name} />
            <Row label="재직기간" value={`${employee.hire_date} ~ ${employee.leave_date ?? '현재'}`} />
            <Row label="부    서" value={employee.department} />
            <Row label="직    책" value={employee.position} />
            {data.careers.length > 0 && (
              <Row label="담당업무" value={data.careers.map(c => c.position).join(', ')} />
            )}
          </tbody>
        </table>
        <p className="text-sm leading-relaxed">위 사람의 경력을 증명합니다.</p>
      </>
    )
  }

  if (data.type === 'salary') {
    const { record } = data
    const allowanceTotal = record.allowances.reduce((s, a) => s + a.amount, 0)
    return (
      <>
        <table className="text-sm mb-8">
          <tbody>
            <Row label="성    명" value={employee.name} />
            <Row label="기준연월" value={record.year_month} />
            <Row label="기 본 급" value={formatKRW(record.base_salary)} />
            <Row label="수당합계" value={formatKRW(allowanceTotal)} />
            <Row label="지급총액" value={formatKRW(record.gross_pay)} />
            <Row label="실수령액" value={formatKRW(record.net_pay)} />
          </tbody>
        </table>
        <p className="text-sm leading-relaxed">위 사람의 급여를 확인합니다.</p>
      </>
    )
  }

  // resignation
  return (
    <>
      <table className="text-sm mb-8">
        <tbody>
          <Row label="성    명" value={employee.name} />
          <Row label="입 사 일" value={employee.hire_date} />
          <Row label="퇴 직 일" value={employee.leave_date ?? '-'} />
          <Row label="고용형태" value={EMPLOYMENT_LABELS[employee.employment_type] ?? employee.employment_type} />
        </tbody>
      </table>
      <p className="text-sm leading-relaxed">위 사람은 당 기관에서 근무 후 퇴직하였음을 증명합니다.</p>
    </>
  )
}

export function CertificatePreview({ data, purpose }: Props) {
  const today = new Date()
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #certificate-print-area { display: block !important; }
        }
      `}</style>

      <div
        id="certificate-print-area"
        className="bg-white p-16 min-h-[29.7cm] max-w-[21cm] mx-auto border font-serif"
        style={{ fontFamily: 'Malgun Gothic, serif' }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-gray-500 mb-4">보조공학센터</p>
          <h1 className="text-3xl font-bold tracking-[0.3em]">{CERT_LABELS[data.type]}</h1>
        </div>

        {/* Body */}
        <div className="mb-12">
          <CertBody data={data} />
        </div>

        {/* Purpose */}
        {purpose && (
          <p className="text-sm text-gray-500 mb-8">용도: {purpose}</p>
        )}

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-sm mb-8">{dateStr}</p>
          <p className="text-sm font-medium">보조공학센터</p>
          <p className="text-sm mt-4">대표자 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (인)</p>
        </div>
      </div>
    </>
  )
}
