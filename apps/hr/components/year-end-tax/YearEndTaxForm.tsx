'use client'

import { useState, useTransition } from 'react'
import { upsertYearEndTax } from '@/actions/year-end-tax-actions'
import { calcYearEndTax } from '@/lib/year-end-tax-calculator'
import type { YearEndTaxRecord } from '@/actions/year-end-tax-actions'

interface Props {
  employeeId: string
  taxYear: number
  grossIncome: number
  prepaidIncomeTax: number
  prepaidLocalTax: number
  existing: YearEndTaxRecord | null
}

function w(n: number) { return n.toLocaleString('ko-KR') }
function sign(n: number) { return n >= 0 ? `+${w(n)}` : `${w(n)}` }

function numInput(label: string, value: string, onChange: (v: string) => void, hint?: string) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <div className="relative">
        <input
          type="number"
          min={0}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-8"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
      </div>
    </div>
  )
}

export function YearEndTaxForm({ employeeId, taxYear, grossIncome, prepaidIncomeTax, prepaidLocalTax, existing }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    dependentsCount:    String(existing?.dependents_count ?? 0),
    elderlyCount:       String(existing?.elderly_count ?? 0),
    disabledCount:      String(existing?.disabled_count ?? 0),
    medicalExpenses:    String(existing?.medical_expenses ?? 0),
    educationExpenses:  String(existing?.education_expenses ?? 0),
    housingRent:        String(existing?.housing_rent ?? 0),
    note:               existing?.note ?? '',
  })

  function setField(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const liveInput = {
    grossIncome,
    dependentsCount:   parseInt(form.dependentsCount) || 0,
    elderlyCount:      parseInt(form.elderlyCount) || 0,
    disabledCount:     parseInt(form.disabledCount) || 0,
    medicalExpenses:   parseInt(form.medicalExpenses) || 0,
    educationExpenses: parseInt(form.educationExpenses) || 0,
    housingRent:       parseInt(form.housingRent) || 0,
    prepaidIncomeTax,
    prepaidLocalTax,
  }
  const preview = calcYearEndTax(liveInput)
  const refundTotal = preview.refundIncomeTax + preview.refundLocalTax

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await upsertYearEndTax({
        employeeId,
        taxYear,
        grossIncome,
        dependentsCount:   parseInt(form.dependentsCount) || 0,
        elderlyCount:      parseInt(form.elderlyCount) || 0,
        disabledCount:     parseInt(form.disabledCount) || 0,
        medicalExpenses:   parseInt(form.medicalExpenses) || 0,
        educationExpenses: parseInt(form.educationExpenses) || 0,
        housingRent:       parseInt(form.housingRent) || 0,
        note:              form.note || null,
      })
      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장에 실패했습니다')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* 총급여 요약 */}
      <div className="bg-gray-50 border rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500 mb-1">연간 총급여</p>
          <p className="text-lg font-bold text-gray-900">{w(grossIncome)}원</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">기납부 소득세</p>
          <p className="text-base font-semibold text-gray-700">{w(prepaidIncomeTax)}원</p>
          <p className="text-xs text-gray-400">지방세 {w(prepaidLocalTax)}원 포함 시 {w(prepaidIncomeTax + prepaidLocalTax)}원</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">예상 환급/추납</p>
          <p className={`text-lg font-bold ${refundTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {sign(refundTotal)}원
          </p>
        </div>
      </div>

      {/* 인적공제 */}
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-3">□ 인적공제</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">부양가족 수</label>
            <p className="text-xs text-gray-400 mb-1">본인 제외 (1인당 150만원)</p>
            <input
              type="number" min={0} value={form.dependentsCount}
              onChange={e => setField('dependentsCount', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">경로우대 인원</label>
            <p className="text-xs text-gray-400 mb-1">70세 이상 (1인당 100만원 추가)</p>
            <input
              type="number" min={0} value={form.elderlyCount}
              onChange={e => setField('elderlyCount', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">장애인 인원</label>
            <p className="text-xs text-gray-400 mb-1">1인당 200만원 추가공제</p>
            <input
              type="number" min={0} value={form.disabledCount}
              onChange={e => setField('disabledCount', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          인적공제 합계: {w(preview.personalDeduction)}원
        </p>
      </div>

      {/* 특별세액공제 */}
      <div className="border-t pt-5">
        <p className="text-sm font-semibold text-gray-800 mb-3">□ 특별세액공제 지출액</p>
        <div className="space-y-4">
          {numInput('의료비 지출액', form.medicalExpenses, v => setField('medicalExpenses', v),
            `총급여(${w(grossIncome)}원)의 3% 초과분(${w(Math.round(grossIncome * 0.03))}원 초과)의 15% 공제`
          )}
          {numInput('교육비 지출액', form.educationExpenses, v => setField('educationExpenses', v),
            '부양가족 1인당 300만원 한도, 15% 공제'
          )}
          {numInput('월세 연간 납부액', form.housingRent, v => setField('housingRent', v),
            `총급여 5,500만원 이하 시 연 750만원 한도 15% 공제 ${grossIncome > 55_000_000 ? '(총급여 초과로 미적용)' : ''}`
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          특별세액공제 합계: {w(preview.specialTaxCredit)}원
        </p>
      </div>

      {/* 계산 결과 미리보기 */}
      <div className="border-t pt-5">
        <p className="text-sm font-semibold text-gray-800 mb-3">□ 계산 결과 (실시간)</p>
        <div className="bg-white border rounded-lg divide-y text-sm">
          {[
            ['연간 총급여',         w(grossIncome)                          + '원'],
            ['(-)근로소득공제',     `(-)${w(preview.earnedIncomeDeduction)}` + '원'],
            ['(-)인적공제',         `(-)${w(preview.personalDeduction)}`     + '원'],
            ['과세표준',            w(preview.taxableIncome)                 + '원'],
            ['산출세액',            w(preview.calculatedIncomeTax)           + '원'],
            ['(-)근로소득세액공제', `(-)${w(preview.earnedIncomeTaxCredit)}` + '원'],
            ['(-)특별세액공제',     `(-)${w(preview.specialTaxCredit)}`      + '원'],
            ['결정세액 (소득세)',   w(preview.finalIncomeTax)                + '원', true],
            ['결정세액 (지방세)',   w(preview.finalLocalTax)                 + '원'],
            ['기납부세액 (소득세)', w(prepaidIncomeTax)                      + '원'],
            ['기납부세액 (지방세)', w(prepaidLocalTax)                       + '원'],
          ].map(([label, value, bold]) => (
            <div key={label as string} className="flex justify-between px-4 py-2">
              <span className={`text-gray-600 ${bold ? 'font-semibold' : ''}`}>{label as string}</span>
              <span className={`${bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{value as string}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 bg-gray-50">
            <span className="font-bold text-gray-800">환급(+) / 추납(-)</span>
            <span className={`font-bold text-lg ${refundTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {sign(refundTotal)}원
            </span>
          </div>
        </div>
      </div>

      {/* 메모 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
        <textarea
          rows={2}
          value={form.note}
          onChange={e => setField('note', e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">저장되었습니다</p>}

      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50"
      >
        {isPending ? '저장 중...' : '연말정산 저장'}
      </button>
    </form>
  )
}
