'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPendingClient } from '@/actions/client-actions'

const INPUT = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const SELECT = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

const DISABILITY_OPTIONS = [
  { value: 'physical', label: '지체' },
  { value: 'brain_lesion', label: '뇌병변' },
  { value: 'visual', label: '시각' },
  { value: 'hearing', label: '청각' },
  { value: 'language', label: '언어' },
  { value: 'intellectual', label: '지적' },
  { value: 'autism', label: '자폐성' },
  { value: 'mental', label: '정신' },
  { value: 'kidney', label: '신장' },
  { value: 'cardiac', label: '심장' },
  { value: 'respiratory', label: '호흡기' },
  { value: 'liver', label: '간' },
  { value: 'face', label: '안면' },
  { value: 'intestine', label: '장루·요루' },
  { value: 'epilepsy', label: '뇌전증' },
]

const GANGWON_CITIES = [
  '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시',
  '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군',
  '양구군', '인제군', '고성군', '양양군',
]

const HOUSING_TYPES = ['단독주택', '아파트', '연립/다세대', '기숙사', '노인복지시설', '장애인복지시설', '기타']
const ECONOMIC_STATUSES = ['기초생활수급', '차상위', '일반']
const CARE_LEVELS = ['1등급', '2등급', '3등급', '4등급', '5등급', '인지지원등급', '해당없음']
const DISABILITY_PROGRESSIONS = ['진행성', '비진행성', '호전 중']

export function PendingClientForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    birth_date: '',
    gender: '',
    email: '',
    contact: '',
    guardian_name: '',
    guardian_relationship: '',
    guardian_contact: '',
    economic_status: '',
    city: '',
    address: '',
    housing_type: '',
    floor_number: '',
    has_elevator: '',
    obstacles: '',
    disability_type: '',
    disability_grade: '',
    disability_cause: '',
    disability_onset_date: '',
    disability_description: '',
    secondary_disability_type: '',
    care_level: '',
    disability_progression: '',
    progression_cause: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('이름은 필수 입력 항목입니다'); return }
    setLoading(true)
    setError(null)
    const result = await createPendingClient({
      name: form.name.trim(),
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      email: form.email || null,
      contact: form.contact || null,
      guardian_name: form.guardian_name || null,
      guardian_relationship: form.guardian_relationship || null,
      guardian_contact: form.guardian_contact || null,
      economic_status: form.economic_status || null,
      city: form.city || null,
      address: form.address || null,
      housing_type: form.housing_type || null,
      floor_number: form.floor_number || null,
      has_elevator: form.has_elevator === 'yes' ? true : form.has_elevator === 'no' ? false : null,
      obstacles: form.obstacles || null,
      disability_type: form.disability_type || null,
      disability_grade: form.disability_grade || null,
      disability_cause: form.disability_cause || null,
      disability_onset_date: form.disability_onset_date || null,
      disability_description: form.disability_description || null,
      secondary_disability_type: form.secondary_disability_type || null,
      care_level: form.care_level || null,
      disability_progression: form.disability_progression || null,
      progression_cause: form.progression_cause || null,
    })
    setLoading(false)
    if (!result.success) { setError(result.error ?? '저장에 실패했습니다'); return }
    router.push('/clients/pending')
    router.refresh()
  }

  const field = (name: string, label: string, type = 'text', required = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type={type}
        value={form[name as keyof typeof form] as string}
        onChange={handleChange}
        required={required}
        className={INPUT}
      />
    </div>
  )

  const select = (name: string, label: string, options: string[]) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        name={name}
        value={form[name as keyof typeof form] as string}
        onChange={handleChange}
        className={SELECT}
      >
        <option value="">선택</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

      {/* 기본 정보 */}
      <fieldset className="border rounded-lg p-5 space-y-4">
        <legend className="text-sm font-semibold text-gray-800 px-1">기본 정보</legend>
        <div className="grid grid-cols-3 gap-4">
          {field('name', '이름', 'text', true)}
          {field('birth_date', '생년월일', 'date')}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">성별</label>
            <select name="gender" value={form.gender} onChange={handleChange} className={SELECT}>
              <option value="">선택</option>
              <option value="남">남</option>
              <option value="여">여</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field('contact', '본인 연락처')}
          {field('email', '이메일', 'email')}
        </div>
        {select('economic_status', '경제상황', ECONOMIC_STATUSES)}
      </fieldset>

      {/* 보호자 정보 */}
      <fieldset className="border rounded-lg p-5 space-y-4">
        <legend className="text-sm font-semibold text-gray-800 px-1">보호자 정보</legend>
        <div className="grid grid-cols-3 gap-4">
          {field('guardian_name', '보호자 성명')}
          {field('guardian_relationship', '관계')}
          {field('guardian_contact', '보호자 연락처')}
        </div>
      </fieldset>

      {/* 거주지 정보 */}
      <fieldset className="border rounded-lg p-5 space-y-4">
        <legend className="text-sm font-semibold text-gray-800 px-1">거주지 정보</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">거주지(시군)</label>
            <select name="city" value={form.city} onChange={handleChange} className={SELECT}>
              <option value="">선택</option>
              {GANGWON_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {field('address', '상세주소')}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {select('housing_type', '주거형태', HOUSING_TYPES)}
          {field('floor_number', '층수')}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">엘리베이터 유무</label>
            <select name="has_elevator" value={form.has_elevator} onChange={handleChange} className={SELECT}>
              <option value="">선택</option>
              <option value="yes">있음</option>
              <option value="no">없음</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">장애물</label>
          <input name="obstacles" value={form.obstacles} onChange={handleChange} className={INPUT} placeholder="예) 문턱, 계단" />
        </div>
      </fieldset>

      {/* 장애 정보 */}
      <fieldset className="border rounded-lg p-5 space-y-4">
        <legend className="text-sm font-semibold text-gray-800 px-1">장애 정보</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">주 장애유형</label>
            <select name="disability_type" value={form.disability_type} onChange={handleChange} className={SELECT}>
              <option value="">선택</option>
              {DISABILITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">주 장애정도</label>
            <select name="disability_grade" value={form.disability_grade} onChange={handleChange} className={SELECT}>
              <option value="">선택</option>
              <option value="심한">심한</option>
              <option value="심하지 않은">심하지 않은</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field('disability_cause', '주 장애원인')}
          {field('disability_onset_date', '발생시기', 'date')}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">부 장애유형</label>
          <select name="secondary_disability_type" value={form.secondary_disability_type} onChange={handleChange} className={SELECT}>
            <option value="">선택</option>
            {DISABILITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {select('care_level', '요양등급', CARE_LEVELS)}
        <div className="grid grid-cols-2 gap-4">
          {select('disability_progression', '장애 진행정도', DISABILITY_PROGRESSIONS)}
          {field('progression_cause', '진행 원인')}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">장애 상태 기술</label>
          <textarea
            name="disability_description"
            value={form.disability_description}
            onChange={handleChange}
            rows={3}
            className={INPUT}
            placeholder="장애 상태를 자세히 기술하세요"
          />
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 border rounded-lg font-medium text-gray-700 hover:bg-gray-50 text-sm"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {loading ? '저장 중...' : '접수 임시 저장'}
        </button>
      </div>
    </form>
  )
}
