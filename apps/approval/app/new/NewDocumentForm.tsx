'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDocument, submitDocument } from '@/actions/approval-actions'
import type {
  ApprovalDocumentType,
  ApprovalVehicle,
  ExpenditureContent,
  LeaveContent,
  BusinessReportContent,
  GrantReferralContent,
  VehicleLogContent,
  LeaveSubType,
} from '@co-at/types'

const DOC_TYPES: { value: ApprovalDocumentType; label: string; desc: string }[] = [
  { value: 'vehicle_log',      label: '차량운행일지',        desc: '법인 차량 업무 운행 기록 및 결재' },
  { value: 'grant_referral',   label: '교부사업 접수공문',   desc: '시군구 의뢰 공문 접수 및 결재 처리' },
  { value: 'expenditure',      label: '지출 결의서',         desc: '구매·비용 지출 승인 요청' },
  { value: 'leave',            label: '휴가/출장 신청서',    desc: '연차·반차·출장 등 신청' },
  { value: 'business_report',  label: '업무 보고서/기안문',  desc: '업무 보고 및 기안 작성' },
]

const LEAVE_SUBTYPES: { value: LeaveSubType; label: string }[] = [
  { value: 'annual',        label: '연차' },
  { value: 'half',          label: '반차' },
  { value: 'business_trip', label: '출장' },
  { value: 'other',         label: '기타' },
]

interface Props {
  vehicles: ApprovalVehicle[]
}

export default function NewDocumentForm({ vehicles }: Props) {
  const router = useRouter()
  const [docType, setDocType] = useState<ApprovalDocumentType | null>(null)
  const [title, setTitle]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Expenditure fields
  const [itemName, setItemName]   = useState('')
  const [amount, setAmount]       = useState('')
  const [spendDate, setSpendDate] = useState('')
  const [expNote, setExpNote]     = useState('')

  // Leave fields
  const [leaveType, setLeaveType]     = useState<LeaveSubType>('annual')
  const [startDate, setStartDate]     = useState('')
  const [endDate, setEndDate]         = useState('')
  const [reason, setReason]           = useState('')
  const [destination, setDestination] = useState('')

  // Business report fields
  const [background, setBackground] = useState('')
  const [body, setBody]             = useState('')

  // Grant referral fields
  const [grDocNumber, setGrDocNumber]         = useState('')
  const [grSendingOrg, setGrSendingOrg]       = useState('')
  const [grDocDate, setGrDocDate]             = useState('')
  const [grReceiveDate, setGrReceiveDate]     = useState(new Date().toISOString().slice(0, 10))
  const [grReferralRound, setGrReferralRound] = useState('')
  const [grReferralCount, setGrReferralCount] = useState('')
  const [grNote, setGrNote]                   = useState('')

  // Vehicle log fields
  const [vlVehicleId, setVlVehicleId]         = useState(vehicles[0]?.id ?? '')
  const [vlDriverName, setVlDriverName]       = useState('')
  const [vlPurpose, setVlPurpose]             = useState('')
  const [vlDeparture, setVlDeparture]         = useState('')
  const [vlDestination, setVlDestination]     = useState('')
  const [vlDepartAt, setVlDepartAt]           = useState('')
  const [vlArriveAt, setVlArriveAt]           = useState('')
  const [vlStartOdometer, setVlStartOdometer] = useState('')
  const [vlEndOdometer, setVlEndOdometer]     = useState('')
  const [vlFuelCost, setVlFuelCost]           = useState('')
  const [vlTollFee, setVlTollFee]             = useState('')
  const [vlParkingFee, setVlParkingFee]       = useState('')
  const [vlNote, setVlNote]                   = useState('')

  function buildContent(): ExpenditureContent | LeaveContent | BusinessReportContent | GrantReferralContent | VehicleLogContent | null {
    if (docType === 'expenditure') {
      if (!itemName || !amount || !spendDate) return null
      return { item_name: itemName, amount: Number(amount), spend_date: spendDate, note: expNote || undefined }
    }
    if (docType === 'leave') {
      if (!startDate || !endDate || !reason) return null
      return { leave_type: leaveType, start_date: startDate, end_date: endDate, reason, destination: destination || undefined }
    }
    if (docType === 'business_report') {
      if (!background || !body) return null
      return { background, body }
    }
    if (docType === 'grant_referral') {
      if (!grSendingOrg) return null
      return {
        doc_number:     grDocNumber || undefined,
        sending_org:    grSendingOrg,
        doc_date:       grDocDate || undefined,
        receive_date:   grReceiveDate || undefined,
        referral_round: grReferralRound ? Number(grReferralRound) : undefined,
        referral_count: grReferralCount ? Number(grReferralCount) : undefined,
        note:           grNote || undefined,
      }
    }
    if (docType === 'vehicle_log') {
      const start = Number(vlStartOdometer)
      const end   = Number(vlEndOdometer)
      if (!vlVehicleId || !vlDriverName || !vlPurpose || !vlDeparture || !vlDestination || !vlDepartAt || !vlArriveAt || !vlStartOdometer || !vlEndOdometer) return null
      if (end <= start) { setError('종료 주행거리는 시작 주행거리보다 커야 합니다.'); return null }
      const vehicle = vehicles.find(v => v.id === vlVehicleId)
      return {
        vehicle_id:      vlVehicleId,
        vehicle_number:  vehicle?.number ?? '',
        driver_name:     vlDriverName,
        purpose:         vlPurpose,
        departure:       vlDeparture,
        destination:     vlDestination,
        depart_at:       vlDepartAt,
        arrive_at:       vlArriveAt,
        start_odometer:  start,
        end_odometer:    end,
        fuel_cost:    vlFuelCost    ? Number(vlFuelCost)    : undefined,
        toll_fee:     vlTollFee     ? Number(vlTollFee)     : undefined,
        parking_fee:  vlParkingFee  ? Number(vlParkingFee)  : undefined,
        note:         vlNote        || undefined,
      }
    }
    return null
  }

  async function handleSaveDraft() {
    if (!docType || !title) { setError('문서 유형과 제목을 입력해주세요.'); return }
    const content = buildContent()
    if (!content) { if (!error) setError('필수 항목을 모두 입력해주세요.'); return }
    setSaving(true); setError(null)
    const doc = await createDocument({ type: docType, title, content })
    if (!doc) { setError('저장 실패. 다시 시도해주세요.'); setSaving(false); return }
    router.push(`/${doc.id}`)
  }

  async function handleSubmit() {
    if (!docType || !title) { setError('문서 유형과 제목을 입력해주세요.'); return }
    const content = buildContent()
    if (!content) { if (!error) setError('필수 항목을 모두 입력해주세요.'); return }
    setSaving(true); setError(null)
    const doc = await createDocument({ type: docType, title, content })
    if (!doc) { setError('저장 실패.'); setSaving(false); return }
    const ok = await submitDocument(doc.id)
    if (!ok) { setError('제출 실패.'); setSaving(false); return }
    router.push(`/${doc.id}`)
  }

  if (!docType) {
    return (
      <div className="p-8 space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">기안하기</h1>
        <p className="text-sm text-gray-500">작성할 문서 유형을 선택하세요.</p>
        <div className="grid gap-4">
          {DOC_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setDocType(t.value)}
              className="text-left border rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <p className="font-medium">{t.label}</p>
              <p className="text-sm text-gray-500 mt-1">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => { setDocType(null); setError(null) }} className="text-sm text-gray-500 hover:text-gray-700">← 뒤로</button>
        <h1 className="text-2xl font-bold">
          {DOC_TYPES.find(t => t.value === docType)?.label}
        </h1>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">문서 제목 *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={docType === 'vehicle_log' ? '예: 2026년 7월 차량운행일지 (카니발)' : '예: 2026년 5월 사무용품 구매 지출 결의'}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        {docType === 'vehicle_log' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">차량 *</label>
                <select value={vlVehicleId} onChange={e => setVlVehicleId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.number} ({v.name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">운전자 *</label>
                <input value={vlDriverName} onChange={e => setVlDriverName(e.target.value)} placeholder="홍길동" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">업무 목적 *</label>
              <input value={vlPurpose} onChange={e => setVlPurpose(e.target.value)} placeholder="예: 대상자 가정 방문 평가" className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">출발지 *</label>
                <input value={vlDeparture} onChange={e => setVlDeparture(e.target.value)} placeholder="예: 센터" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">목적지 *</label>
                <input value={vlDestination} onChange={e => setVlDestination(e.target.value)} placeholder="예: 강릉시 교동" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">출발 일시 *</label>
                <input type="datetime-local" value={vlDepartAt} onChange={e => setVlDepartAt(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">도착 일시 *</label>
                <input type="datetime-local" value={vlArriveAt} onChange={e => setVlArriveAt(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작 주행거리 (km) *</label>
                <input type="number" min="0" value={vlStartOdometer} onChange={e => setVlStartOdometer(e.target.value)} placeholder="예: 12500" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료 주행거리 (km) *</label>
                <input type="number" min="0" value={vlEndOdometer} onChange={e => setVlEndOdometer(e.target.value)} placeholder="예: 12573" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            {vlStartOdometer && vlEndOdometer && Number(vlEndOdometer) > Number(vlStartOdometer) && (
              <p className="text-sm text-blue-600 font-medium">
                실주행거리: {(Number(vlEndOdometer) - Number(vlStartOdometer)).toLocaleString()} km
              </p>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주유비 (원)</label>
                <input type="number" min="0" value={vlFuelCost} onChange={e => setVlFuelCost(e.target.value)} placeholder="0" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">통행료 (원)</label>
                <input type="number" min="0" value={vlTollFee} onChange={e => setVlTollFee(e.target.value)} placeholder="0" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주차비 (원)</label>
                <input type="number" min="0" value={vlParkingFee} onChange={e => setVlParkingFee(e.target.value)} placeholder="0" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
              <textarea value={vlNote} onChange={e => setVlNote(e.target.value)} rows={2} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </>
        )}

        {docType === 'expenditure' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">항목명 *</label>
              <input value={itemName} onChange={e => setItemName(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">금액 (원) *</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">지출일 *</label>
                <input type="date" value={spendDate} onChange={e => setSpendDate(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
              <textarea value={expNote} onChange={e => setExpNote(e.target.value)} rows={2} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </>
        )}

        {docType === 'leave' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">유형 *</label>
              <select value={leaveType} onChange={e => setLeaveType(e.target.value as LeaveSubType)} className="w-full border rounded-md px-3 py-2 text-sm">
                {LEAVE_SUBTYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일 *</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사유 *</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            {leaveType === 'business_trip' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">행선지</label>
                <input value={destination} onChange={e => setDestination(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            )}
          </>
        )}

        {docType === 'business_report' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">배경 및 목적 *</label>
              <textarea value={background} onChange={e => setBackground(e.target.value)} rows={3} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </>
        )}

        {docType === 'grant_referral' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">발송기관 *</label>
                <input value={grSendingOrg} onChange={e => setGrSendingOrg(e.target.value)} placeholder="예) 강릉시청 복지과" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">공문번호</label>
                <input value={grDocNumber} onChange={e => setGrDocNumber(e.target.value)} placeholder="예) 복지-1234" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">공문일</label>
                <input type="date" value={grDocDate} onChange={e => setGrDocDate(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">접수일</label>
                <input type="date" value={grReceiveDate} onChange={e => setGrReceiveDate(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">의뢰 회차</label>
                <input type="number" min="1" value={grReferralRound} onChange={e => setGrReferralRound(e.target.value)} placeholder="예) 1" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">의뢰 건수</label>
                <input type="number" min="0" value={grReferralCount} onChange={e => setGrReferralCount(e.target.value)} placeholder="예) 5" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
              <textarea value={grNote} onChange={e => setGrNote(e.target.value)} rows={2} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          임시저장
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '처리 중...' : '결재 요청'}
        </button>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 px-2">취소</button>
      </div>
    </div>
  )
}
