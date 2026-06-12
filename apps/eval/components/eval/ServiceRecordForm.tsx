'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createServiceRecord } from '@/actions/service-record-actions'
import { generateServiceRecordDraft } from '@/actions/ai-actions'
import { ITEM_CATEGORIES } from '@/eval/lib/item-categories'
import { Sparkles, Loader2 } from 'lucide-react'

const INPUT = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const SELECT = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const READONLY = 'w-full border rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600 cursor-not-allowed'

const MAJOR_CATEGORIES = ['공적급여', '민간지원', '기타', '서비스지원']
const SERVICE_CATEGORIES = [
  '상담', '대여', '맞춤제작', '정보제공', '재사용', '수리',
  '교부사업(맞춤형평가)', '체험/시연', '교육', '모니터링', '기타',
]
const SERVICE_AREAS = ['WC', 'ADL', 'S', 'SP', 'EC', 'CA', 'L', 'AAC', 'AM']
const REFERRAL_TYPES = ['내방', '유선', '인터넷신청', '기관연계', '기타']
const RECORD_STATUSES = ['접수', '진행중', '완료', '보류']

interface ClientData {
  name: string
  birth_date: string | null
  gender: string | null
  disability_type: string | null
  disability_severity: string | null
  economic_status: string | null
  region: string | null
  contact: string | null
}

interface ServiceRecordFormProps {
  clientId: string
  applicationId: string
  clientData?: ClientData
  redirectTo: string
}

type CheckKey =
  | 'is_consult' | 'is_assessment' | 'is_trial' | 'is_rental' | 'is_custom_make'
  | 'is_grant' | 'is_education' | 'is_info_provision' | 'is_repair' | 'is_cleaning'
  | 'is_reuse' | 'is_monitoring' | 'is_other_business' | 'is_phone' | 'is_visit_in'
  | 'is_visit_out' | 'is_public_funding' | 'is_private_funding' | 'is_self_pay'
  | 'is_funding_secured' | 'is_closed'

const INITIAL_CHECKS: Record<CheckKey, boolean> = {
  is_consult: false, is_assessment: false, is_trial: false, is_rental: false,
  is_custom_make: false, is_grant: false, is_education: false, is_info_provision: false,
  is_repair: false, is_cleaning: false, is_reuse: false, is_monitoring: false,
  is_other_business: false, is_phone: false, is_visit_in: false, is_visit_out: false,
  is_public_funding: false, is_private_funding: false, is_self_pay: false,
  is_funding_secured: false, is_closed: false,
}

type SmartDefaultFields = Partial<Record<CheckKey, boolean> & { service_content: string }>

const SMART_DEFAULTS: Record<string, SmartDefaultFields> = {
  '상담': {
    is_consult: true,
    service_content: '보조기기 관련 상담을 진행하였습니다.',
  },
  '교부사업(맞춤형평가)': {
    is_assessment: true,
    is_consult: true,
    service_content: '9개 영역 기능 평가 및 맞춤형 보조기기 교부사업 신청 지원을 위한 상담을 진행하였습니다.',
  },
  '대여': {
    is_rental: true,
    is_consult: true,
    service_content: '보조기기 대여 서비스 상담 및 대여 신청을 진행하였습니다.',
  },
  '맞춤제작': {
    is_custom_make: true,
    is_assessment: true,
    is_consult: true,
    service_content: '맞춤형 보조기기 제작 지원을 위한 상담 및 평가를 진행하였습니다.',
  },
  '정보제공': {
    is_info_provision: true,
    is_consult: true,
    service_content: '보조기기 관련 정보 제공 및 자원 연계 안내를 진행하였습니다.',
  },
  '재사용': {
    is_reuse: true,
    is_consult: true,
    service_content: '재사용 보조기기 배분 서비스 상담 및 기기 상태 확인을 진행하였습니다.',
  },
  '수리': {
    is_repair: true,
    service_content: '보조기기 수리 서비스 접수 및 상태 확인을 진행하였습니다.',
  },
  '체험/시연': {
    is_trial: true,
    is_consult: true,
    service_content: '보조기기 체험 및 시연 서비스를 진행하였습니다.',
  },
  '교육': {
    is_education: true,
    service_content: '보조기기 활용 관련 교육을 진행하였습니다.',
  },
  '모니터링': {
    is_monitoring: true,
    service_content: '보조기기 사용 현황 모니터링을 진행하였습니다.',
  },
}

export function ServiceRecordForm({
  clientId,
  applicationId,
  clientData,
  redirectTo,
}: ServiceRecordFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [satisfactionScore, setSatisfactionScore] = useState<number | null>(null)

  // AI-filled fields
  const [serviceContent, setServiceContent] = useState('')
  const [majorCategory, setMajorCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [serviceCategory, setServiceCategory] = useState('')
  const [serviceArea, setServiceArea] = useState('')
  const [productName, setProductName] = useState('')
  const [itemCategory, setItemCategory] = useState('')
  const [referralType, setReferralType] = useState('')
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>(INITIAL_CHECKS)

  function toggleCheck(key: CheckKey) {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleItemCategoryChange(val: string) {
    setItemCategory(val)
    const match = ITEM_CATEGORIES.find(c => c.name === val)
    if (match) setServiceArea(match.area)
  }

  function handleServiceCategoryChange(val: string) {
    setServiceCategory(val)
    const defaults = SMART_DEFAULTS[val]
    if (!defaults) return
    const { service_content, ...checkDefaults } = defaults
    if (service_content !== undefined) setServiceContent(service_content)
    if (Object.keys(checkDefaults).length > 0) {
      setChecks(prev => ({ ...prev, ...(checkDefaults as Partial<Record<CheckKey, boolean>>) }))
    }
  }

  async function handleAiDraft() {
    setAiLoading(true)
    setError(null)
    const result = await generateServiceRecordDraft({ applicationId, clientId })
    setAiLoading(false)
    if (!result.success || !result.draft) {
      setError(result.error ?? 'AI 초안 생성 실패')
      return
    }
    const d = result.draft
    if (d.service_content) setServiceContent(d.service_content)
    if (d.service_major_category) setMajorCategory(d.service_major_category)
    if (d.service_sub_category) setSubCategory(d.service_sub_category)
    if (d.service_category) setServiceCategory(d.service_category)
    if (d.service_area) setServiceArea(d.service_area)
    if (d.product_name) setProductName(d.product_name)
    if (d.referral_type) setReferralType(d.referral_type)
    setChecks(prev => ({
      ...prev,
      is_consult: d.is_consult ?? prev.is_consult,
      is_assessment: d.is_assessment ?? prev.is_assessment,
      is_trial: d.is_trial ?? prev.is_trial,
      is_rental: d.is_rental ?? prev.is_rental,
      is_custom_make: d.is_custom_make ?? prev.is_custom_make,
      is_grant: d.is_grant ?? prev.is_grant,
      is_education: d.is_education ?? prev.is_education,
      is_info_provision: d.is_info_provision ?? prev.is_info_provision,
      is_repair: d.is_repair ?? prev.is_repair,
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const str = (k: string) => (fd.get(k) as string) || null
    const num = (k: string) => { const v = fd.get(k) as string; return v ? parseInt(v) : null }
    const bool = (k: string) => fd.get(k) === 'true'

    const result = await createServiceRecord({
      application_id: applicationId,
      client_id: clientId,
      received_at: str('received_at') ?? new Date().toISOString().split('T')[0],
      application_year: num('application_year'),
      application_month: num('application_month'),
      application_no: num('application_no'),
      is_re_application: bool('is_re_application'),
      record_status: str('record_status'),
      name: clientData?.name ?? str('name'),
      birth_date: clientData?.birth_date ?? str('birth_date'),
      gender: clientData?.gender ?? str('gender'),
      disability_type: clientData?.disability_type ?? str('disability_type'),
      disability_severity: clientData?.disability_severity ?? str('disability_severity'),
      economic_status: clientData?.economic_status ?? str('economic_status'),
      region: clientData?.region ?? str('region'),
      contact: clientData?.contact ?? str('contact'),
      address: str('address'),
      service_major_category: majorCategory || null,
      service_sub_category: subCategory || null,
      service_category: serviceCategory || null,
      product_name: productName || null,
      item_category: itemCategory || null,
      service_area: serviceArea || null,
      service_content: serviceContent || null,
      referral_type: referralType || null,
      consultation_date: str('consultation_date'),
      performance_date: str('performance_date'),
      closed_at: str('closed_at'),
      monitoring_date: str('monitoring_date'),
      ...checks,
      trial_device_count: num('trial_device_count'),
      info_provision_area: str('info_provision_area'),
      funding_source_detail: str('funding_source_detail'),
      staff_name: str('staff_name'),
      satisfaction_score: satisfactionScore,
      satisfaction_comment: str('satisfaction_comment'),
    })

    setSaving(false)
    if (!result.success) { setError(result.error ?? '저장 실패'); return }
    router.push(redirectTo)
    router.refresh()
  }

  function CheckBox({ k, label }: { k: CheckKey; label: string }) {
    return (
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={checks[k]}
          onChange={() => toggleCheck(k)}
          className="rounded border-gray-300"
        />
        <span className="text-sm">{label}</span>
      </label>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {/* ① 기본 정보 */}
      <section className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold text-gray-900">① 기본 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">접수일 <span className="text-red-500">*</span></label>
            <input name="received_at" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">기록상태</label>
            <select name="record_status" defaultValue="" className={SELECT}>
              <option value="">선택</option>
              {RECORD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">신청년도</label>
            <input name="application_year" type="number" defaultValue={new Date().getFullYear()} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">신청월</label>
            <input name="application_month" type="number" min="1" max="12" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">신청번호</label>
            <input name="application_no" type="number" className={INPUT} />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input name="is_re_application" type="checkbox" value="true" className="rounded border-gray-300" />
            <label className="text-sm text-gray-700">재신청</label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          {clientData ? (
            <>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">성명</label><div className={READONLY}>{clientData.name}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">생년월일</label><div className={READONLY}>{clientData.birth_date ?? '—'}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">성별</label><div className={READONLY}>{clientData.gender ?? '—'}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">장애유형</label><div className={READONLY}>{clientData.disability_type ?? '—'}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">장애정도</label><div className={READONLY}>{clientData.disability_severity ?? '—'}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">경제상황</label><div className={READONLY}>{clientData.economic_status ?? '—'}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">지역</label><div className={READONLY}>{clientData.region ?? '—'}</div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">연락처</label><div className={READONLY}>{clientData.contact ?? '—'}</div></div>
            </>
          ) : (
            <>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">성명</label><input name="name" type="text" className={INPUT} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">생년월일</label><input name="birth_date" type="text" placeholder="YYYY-MM-DD" className={INPUT} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">성별</label>
                <select name="gender" defaultValue="" className={SELECT}>
                  <option value="">선택</option>
                  <option value="남">남</option>
                  <option value="여">여</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">장애유형</label><input name="disability_type" type="text" className={INPUT} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">장애정도</label>
                <select name="disability_severity" defaultValue="" className={SELECT}>
                  <option value="">선택</option>
                  <option value="심한">심한</option>
                  <option value="심하지 않은">심하지 않은</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">경제상황</label><input name="economic_status" type="text" className={INPUT} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">지역</label><input name="region" type="text" className={INPUT} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">연락처</label><input name="contact" type="text" className={INPUT} /></div>
            </>
          )}
        </div>
      </section>

      {/* ② 서비스 내용 */}
      <section className="border rounded-lg p-6 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">② 서비스 내용</h3>
          <button
            type="button"
            onClick={handleAiDraft}
            disabled={aiLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {aiLoading ? 'AI 분석 중...' : 'AI 자동 입력'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">대분류</label>
            <select value={majorCategory} onChange={e => setMajorCategory(e.target.value)} className={SELECT}>
              <option value="">선택</option>
              {MAJOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">소분류</label>
            <input value={subCategory} onChange={e => setSubCategory(e.target.value)} type="text" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">서비스구분</label>
            <select value={serviceCategory} onChange={e => handleServiceCategoryChange(e.target.value)} className={SELECT}>
              <option value="">선택</option>
              {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">신청품목</label>
            <input value={productName} onChange={e => setProductName(e.target.value)} type="text" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">품목고시 명칭</label>
            <input
              list="item-categories-list"
              value={itemCategory}
              onChange={e => handleItemCategoryChange(e.target.value)}
              className={INPUT}
              placeholder="품목명 입력 후 선택"
              autoComplete="off"
            />
            <datalist id="item-categories-list">
              {ITEM_CATEGORIES.map(c => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">서비스영역</label>
            <input
              list="service-areas-list"
              value={serviceArea}
              onChange={e => setServiceArea(e.target.value)}
              className={INPUT}
              placeholder="품목고시 선택 시 자동 설정"
            />
            <datalist id="service-areas-list">
              {SERVICE_AREAS.map(a => <option key={a} value={a} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">의뢰구분</label>
            <select value={referralType} onChange={e => setReferralType(e.target.value)} className={SELECT}>
              <option value="">선택</option>
              {REFERRAL_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">서비스 내용</label>
          <textarea value={serviceContent} onChange={e => setServiceContent(e.target.value)} rows={5} className={INPUT} placeholder="서비스 내용을 입력하세요" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">상담일</label><input name="consultation_date" type="date" className={INPUT} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">실적일</label><input name="performance_date" type="date" className={INPUT} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">종결일</label><input name="closed_at" type="date" className={INPUT} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">모니터링일</label><input name="monitoring_date" type="date" className={INPUT} /></div>
        </div>
      </section>

      {/* ③ 서비스 유형 체크박스 */}
      <section className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold text-gray-900">③ 서비스 유형</h3>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">서비스 유형</p>
          <div className="flex flex-wrap gap-3">
            <CheckBox k="is_consult" label="상담" />
            <CheckBox k="is_assessment" label="평가" />
            <CheckBox k="is_trial" label="체험" />
            <CheckBox k="is_rental" label="대여" />
            <CheckBox k="is_custom_make" label="맞춤제작" />
            <CheckBox k="is_grant" label="교부" />
            <CheckBox k="is_education" label="교육" />
            <CheckBox k="is_info_provision" label="정보제공" />
            <CheckBox k="is_repair" label="수리" />
            <CheckBox k="is_cleaning" label="소독" />
            <CheckBox k="is_reuse" label="재사용" />
            <CheckBox k="is_monitoring" label="모니터링" />
            <CheckBox k="is_other_business" label="기타사업" />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">연락 방식</p>
          <div className="flex flex-wrap gap-3">
            <CheckBox k="is_phone" label="유선" />
            <CheckBox k="is_visit_in" label="내방" />
            <CheckBox k="is_visit_out" label="방문(외)" />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">재원</p>
          <div className="flex flex-wrap gap-3">
            <CheckBox k="is_public_funding" label="공적급여" />
            <CheckBox k="is_private_funding" label="민간지원" />
            <CheckBox k="is_self_pay" label="자부담" />
            <CheckBox k="is_funding_secured" label="재원확보" />
          </div>
        </div>
        <div className="flex items-center">
          <CheckBox k="is_closed" label="종결" />
        </div>
      </section>

      {/* ④ 추가 정보 */}
      <section className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold text-gray-900">④ 추가 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">체험기기 수</label><input name="trial_device_count" type="number" min="0" className={INPUT} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">정보제공 지역</label><input name="info_provision_area" type="text" className={INPUT} /></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">재원 상세</label><input name="funding_source_detail" type="text" className={INPUT} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">담당자</label><input name="staff_name" type="text" className={INPUT} /></div>
        </div>
      </section>

      {/* ⑤ 서비스 만족도 (종결 시) */}
      {checks.is_closed && (
        <section className="border rounded-lg p-6 bg-white space-y-4">
          <h3 className="font-semibold text-gray-900">⑤ 서비스 만족도</h3>
          <p className="text-xs text-gray-500">종결 서비스에 대한 이용자 만족도를 기록합니다. (2026 정량평가 서비스효과성 5점 반영)</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(score => (
              <button
                key={score}
                type="button"
                onClick={() => setSatisfactionScore(prev => prev === score ? null : score)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                  satisfactionScore === score
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {score}점
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>매우 불만족</span>
            <span>매우 만족</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">코멘트 (선택)</label>
            <input name="satisfaction_comment" type="text" placeholder="이용자 의견 메모" className={INPUT} />
          </div>
        </section>
      )}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">취소</button>
        <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
