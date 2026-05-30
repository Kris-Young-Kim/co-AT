'use client'

import { useState } from 'react'
import { updateApplicationDetails } from '@/actions/application-actions'
import type { Application } from '@/actions/application-actions'

const INPUT = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const SELECT = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

const REFERRAL_TYPES = ['내방', '유선', '인터넷신청', '기관연계', '기타']
const PROGRESS_TYPES = ['신규', '계속', '재접수']
const BUSINESS_CATEGORIES = ['보조기기 교부사업', '맞춤형제작지원', '대여사업', '정보제공', '교육/홍보', '상담']
const SERVICE_CLASSIFICATIONS = ['상담', '평가', '체험', '대여', '맞춤제작', '교육', '사후관리']
const SERVICE_AREAS = ['이동보조', '자세유지', '의사소통', '정보접근', '일상생활', '교육/학습', '여가/스포츠', '기타']
const STATUS_OPTIONS = ['접수', '배정', '진행중', '완료', '취소']
const VISIT_TYPES = ['내방', '방문']

interface ApplicationDetailFormProps {
  application: Application & {
    referral_type?: string | null
    progress_type?: string | null
    requested_item?: string | null
    service_area?: string | null
    visit_type?: string | null
    notes?: string | null
  }
  clientId: string
  clientName: string
  registrationNumber?: string | null
}

export function ApplicationDetailForm({
  application,
  clientId,
  clientName,
  registrationNumber,
}: ApplicationDetailFormProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    referral_type: application.referral_type ?? '',
    progress_type: application.progress_type ?? '',
    category: application.category ?? '',
    sub_category: application.sub_category ?? '',
    requested_item: application.requested_item ?? '',
    service_area: application.service_area ?? '',
    status: application.status ?? '접수',
    visit_type: application.visit_type ?? '',
    notes: application.notes ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const result = await updateApplicationDetails({
      applicationId: application.id,
      clientId,
      referral_type: form.referral_type || null,
      progress_type: form.progress_type || null,
      category: form.category || null,
      sub_category: form.sub_category || null,
      requested_item: form.requested_item || null,
      service_area: form.service_area || null,
      status: form.status || null,
      visit_type: form.visit_type || null,
      notes: form.notes || null,
    })
    setSaving(false)
    if (!result.success) { setError(result.error ?? '저장 실패'); return }
    setSaved(true)
  }

  const sel = (name: string, label: string, options: string[]) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select name={name} value={form[name as keyof typeof form]} onChange={handleChange} className={SELECT}>
        <option value="">선택</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  const txt = (name: string, label: string) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input name={name} type="text" value={form[name as keyof typeof form]} onChange={handleChange} className={INPUT} />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 대상자 식별 정보 (읽기 전용) */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border text-sm">
        <div>
          <span className="text-gray-500 text-xs">등록코드</span>
          <p className="font-medium mt-0.5">{registrationNumber ?? '—'}</p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">이름</span>
          <p className="font-medium mt-0.5">{clientName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sel('referral_type', '의뢰구분', REFERRAL_TYPES)}
        {sel('progress_type', '진행분류', PROGRESS_TYPES)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {sel('category', '사업분류', BUSINESS_CATEGORIES)}
        {sel('sub_category', '서비스분류', SERVICE_CLASSIFICATIONS)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {txt('requested_item', '신청품목')}
        {sel('service_area', '서비스영역', SERVICE_AREAS)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {sel('status', '접수현황', STATUS_OPTIONS)}
        {sel('visit_type', '내방/방문', VISIT_TYPES)}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">비고</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          className={INPUT}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">저장되었습니다</span>}
      </div>
    </form>
  )
}
