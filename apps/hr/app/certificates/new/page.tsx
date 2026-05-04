'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getEmployees } from '@/actions/employee-actions'
import { getCareersByEmployee } from '@/actions/career-actions'
import { getSalaryRecordsByEmployee } from '@/actions/salary-actions'
import { issueCertificate } from '@/actions/certificate-actions'
import { CertificatePreview } from '@/components/certificates/CertificatePreview'
import type { HrEmployee, HrCareer, HrSalaryRecord, CertificateType } from '@co-at/types'
import type { CertificateData } from '@/components/certificates/CertificatePreview'

const CERT_OPTIONS: { value: CertificateType; label: string }[] = [
  { value: 'employment',  label: '재직증명서' },
  { value: 'career',      label: '경력증명서' },
  { value: 'salary',      label: '급여확인서' },
  { value: 'resignation', label: '퇴직증명서' },
]

export default function NewCertificatePage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<HrEmployee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [certType, setCertType] = useState<CertificateType>('employment')
  const [purpose, setPurpose] = useState('')
  const [salaryRecords, setSalaryRecords] = useState<HrSalaryRecord[]>([])
  const [selectedYearMonth, setSelectedYearMonth] = useState('')
  const [previewData, setPreviewData] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getEmployees().then(setEmployees)
  }, [])

  useEffect(() => {
    if (certType === 'salary' && selectedEmployeeId) {
      getSalaryRecordsByEmployee(selectedEmployeeId).then(records => {
        setSalaryRecords(records)
        setSelectedYearMonth(records[0]?.year_month ?? '')
      })
    } else {
      setSalaryRecords([])
      setSelectedYearMonth('')
    }
  }, [certType, selectedEmployeeId])

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId)

  async function handlePreview() {
    if (!selectedEmployee) { setError('직원을 선택해주세요.'); return }
    setLoading(true)
    setError(null)

    let data: CertificateData | null = null

    if (certType === 'employment') {
      data = { type: 'employment', employee: selectedEmployee }
    } else if (certType === 'career') {
      const careers = await getCareersByEmployee(selectedEmployeeId)
      data = { type: 'career', employee: selectedEmployee, careers }
    } else if (certType === 'salary') {
      if (!selectedYearMonth) { setError('기준 연월을 선택해주세요.'); setLoading(false); return }
      const record = salaryRecords.find(r => r.year_month === selectedYearMonth)
      if (!record) { setError('해당 월 급여 기록이 없습니다.'); setLoading(false); return }
      data = { type: 'salary', employee: selectedEmployee, record }
    } else if (certType === 'resignation') {
      if (!selectedEmployee.leave_date) { setError('퇴직일이 등록된 직원만 퇴직증명서를 발급할 수 있습니다.'); setLoading(false); return }
      data = { type: 'resignation', employee: selectedEmployee }
    }

    setPreviewData(data)
    setLoading(false)
  }

  async function handleIssue() {
    if (!selectedEmployee || !previewData) return
    setIssuing(true)
    setError(null)
    const result = await issueCertificate({
      employee_id: selectedEmployeeId,
      type: certType,
      purpose: purpose || undefined,
    })
    if (!result) {
      setError('발급에 실패했습니다. 발급자가 hr_employees에 등록되어 있어야 합니다.')
      setIssuing(false)
      return
    }
    router.push('/certificates')
  }

  if (previewData) {
    return (
      <div>
        <div className="print:hidden p-6 bg-gray-50 border-b flex items-center gap-4">
          <button
            onClick={() => setPreviewData(null)}
            className="border px-4 py-2 rounded-md text-sm hover:bg-white"
          >
            ← 돌아가기
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
          >
            인쇄
          </button>
          <button
            onClick={handleIssue}
            disabled={issuing}
            className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700 disabled:opacity-50"
          >
            {issuing ? '발급 중...' : '발급 확정 (이력 저장)'}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <CertificatePreview data={previewData} purpose={purpose || undefined} />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">증명서 발급</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">직원 *</label>
          <select
            value={selectedEmployeeId}
            onChange={e => setSelectedEmployeeId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">직원 선택</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} — {e.department}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">증명서 종류 *</label>
          <select
            value={certType}
            onChange={e => setCertType(e.target.value as CertificateType)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            {CERT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {certType === 'salary' && selectedEmployeeId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">기준 연월 *</label>
            {salaryRecords.length === 0 ? (
              <p className="text-sm text-gray-400">급여 기록이 없습니다.</p>
            ) : (
              <select
                value={selectedYearMonth}
                onChange={e => setSelectedYearMonth(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                {salaryRecords.map(r => (
                  <option key={r.year_month} value={r.year_month}>{r.year_month}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">사용 목적</label>
          <input
            type="text"
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            placeholder="예: 금융기관 제출"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handlePreview}
          disabled={!selectedEmployeeId || loading}
          className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? '로딩 중...' : '미리보기'}
        </button>
        <button
          onClick={() => router.back()}
          className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </div>
  )
}
