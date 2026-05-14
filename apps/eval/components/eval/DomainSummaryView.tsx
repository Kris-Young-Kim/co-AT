'use client'

import { useState } from 'react'
import { Pencil, Printer } from 'lucide-react'
import Link from 'next/link'
import type { AssessmentDomainType } from './DomainSelector'
import { DOMAIN_LABELS } from './DomainSelector'
import { DomainAssessmentForm } from './DomainAssessmentForm'
import type { DomainData } from './domain-fields'

interface AssessmentRecord {
  id: string
  evaluation_date: string
  evaluation_data: DomainData | null
  evaluator_opinion: string | null
  recommended_device: string | null
  future_plan: string | null
}

interface Props {
  domain: AssessmentDomainType
  assessment: AssessmentRecord
  applicationId: string
  clientId: string
}

function arr(v: unknown): string[] { return Array.isArray(v) ? (v as string[]) : [] }
function str(v: unknown): string { return v != null && v !== '' ? String(v) : '' }

function DataRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  )
}

function ChipList({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null
  return (
    <div className="flex gap-2 text-sm items-start">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1">
        {values.map(v => (
          <span key={v} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{v}</span>
        ))}
      </div>
    </div>
  )
}

function renderSummaryRows(domain: AssessmentDomainType, data: DomainData) {
  const rows: React.ReactNode[] = []
  const k = (key: string) => data[key]

  switch (domain) {
    case 'WC':
      rows.push(<DataRow key="hw" label="키 / 몸무게" value={str(k('height')) && str(k('weight')) ? `${str(k('height'))}cm / ${str(k('weight'))}kg` : null} />)
      rows.push(<DataRow key="hypot" label="기립성 저혈압" value={str(k('orthostatic_hypotension'))} />)
      rows.push(<DataRow key="walk" label="자가 보행" value={str(k('self_ambulatory'))} />)
      rows.push(<DataRow key="transfer" label="옮겨앉기" value={str(k('transfer'))} />)
      rows.push(<ChipList key="manip" label="조작 능력" values={arr(k('manipulation'))} />)
      rows.push(<ChipList key="type" label="필요 기능" values={arr(k('needed_type'))} />)
      rows.push(<ChipList key="opt" label="옵션" values={arr(k('needed_options'))} />)
      break
    case 'ADL': {
      const ADL_MAP: [string, string][] = [
        ['adl_grooming','몸치장'],['adl_eating','식사'],['adl_bathing','목욕'],
        ['adl_dressing','옷입기'],['adl_toilet','화장실'],['adl_bowel','대변'],['adl_bladder','소변'],
      ]
      ADL_MAP.forEach(([key, lbl]) => rows.push(<DataRow key={key} label={lbl} value={str(k(key))} />))
      rows.push(<DataRow key="smart" label="스마트기기 보유" value={str(k('smart_device_owned'))} />)
      rows.push(<ChipList key="sinput" label="대체 입력" values={arr(k('smart_input'))} />)
      break
    }
    case 'S':
      rows.push(<DataRow key="vr" label="시각(우측)" value={str(k('vision_right_defect'))} />)
      rows.push(<DataRow key="vl" label="시각(좌측)" value={str(k('vision_left_defect'))} />)
      rows.push(<DataRow key="vmob" label="보행" value={str(k('vision_mobility'))} />)
      rows.push(<DataRow key="hdef" label="청각 결함" value={str(k('hearing_defect'))} />)
      rows.push(<DataRow key="haid" label="보청기" value={str(k('hearing_aid'))} />)
      rows.push(<ChipList key="hcomm" label="소통 방법" values={arr(k('hearing_comm'))} />)
      break
    case 'SP':
      rows.push(<DataRow key="post" label="주된 활동 자세" value={str(k('main_posture'))} />)
      rows.push(<DataRow key="pelvis" label="골반 경사" value={str(k('pelvis_tilt'))} />)
      rows.push(<DataRow key="trunk" label="체간" value={str(k('trunk_sagittal'))} />)
      if (str(k('m_C'))) rows.push(<DataRow key="mC" label="엉덩오금 수평(C)" value={`${str(k('m_C'))}cm`} />)
      if (str(k('m_G'))) rows.push(<DataRow key="mG" label="오금 높이(G)" value={`${str(k('m_G'))}cm`} />)
      if (str(k('m_E'))) rows.push(<DataRow key="mE" label="엉덩이 너비(E)" value={`${str(k('m_E'))}cm`} />)
      break
    case 'EC':
      rows.push(<DataRow key="ht" label="주거 형태" value={str(k('housing_type'))} />)
      rows.push(<DataRow key="own" label="소유 형태" value={str(k('housing_ownership'))} />)
      rows.push(<DataRow key="mod" label="개조 여부" value={str(k('modified'))} />)
      rows.push(<ChipList key="acc" label="매개시설" values={arr(k('access_areas'))} />)
      rows.push(<ChipList key="int" label="내부시설" values={arr(k('interior_areas'))} />)
      rows.push(<ChipList key="iot" label="IoT 장비" values={arr(k('iot_devices'))} />)
      break
    case 'CA':
      rows.push(<DataRow key="pc" label="컴퓨터 소유" value={str(k('pc_owned'))} />)
      rows.push(<DataRow key="exp" label="사용 경험" value={str(k('pc_experience'))} />)
      rows.push(<DataRow key="mouse" label="마우스" value={str(k('mouse_use'))} />)
      rows.push(<DataRow key="kb" label="키보드" value={str(k('keyboard_use'))} />)
      rows.push(<ChipList key="bp" label="신체 부위" values={arr(k('body_part'))} />)
      rows.push(<ChipList key="need" label="필요 사항" values={arr(k('ca_needs'))} />)
      break
    case 'L':
      rows.push(<ChipList key="env" label="사용 환경" values={arr(k('environment'))} />)
      rows.push(<DataRow key="align" label="자세 정렬" value={str(k('posture_alignment'))} />)
      rows.push(<DataRow key="sit" label="착석 균형" value={str(k('sitting_balance'))} />)
      rows.push(<DataRow key="sup" label="착석 지지" value={str(k('sitting_support'))} />)
      rows.push(<ChipList key="ex" label="운동/훈련" values={arr(k('exercise'))} />)
      break
    case 'AAC':
      rows.push(<DataRow key="voc" label="발성" value={str(k('vocalization'))} />)
      rows.push(<DataRow key="verb" label="발화" value={str(k('verbalization'))} />)
      rows.push(<ChipList key="alt" label="대체 수단" values={arr(k('alt_means'))} />)
      rows.push(<DataRow key="intfam" label="말 명료도(친숙)" value={str(k('intelligibility_familiar'))} />)
      rows.push(<DataRow key="sym" label="상징화" value={str(k('symbolization'))} />)
      rows.push(<ChipList key="sym2" label="심볼 유형" values={arr(k('symbol_type'))} />)
      break
    case 'AM':
      rows.push(<DataRow key="lic" label="운전 면허" value={str(k('license'))} />)
      rows.push(<DataRow key="veh" label="차량" value={str(k('vehicle_model') ?? k('vehicle_type'))} />)
      {
        const needed = Object.keys(data)
          .filter(key => key.startsWith('am_') && !key.endsWith('_detail') && str(data[key]) === '필요')
        if (needed.length) rows.push(
          <DataRow key="n" label="보조기기 필요" value={`${needed.length}항목`} />
        )
      }
      break
  }
  return rows.filter(Boolean)
}

export function DomainSummaryView({ domain, assessment, applicationId, clientId }: Props) {
  const [editing, setEditing] = useState(false)
  const data = assessment.evaluation_data ?? {}

  if (editing) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <DomainAssessmentForm
          applicationId={applicationId}
          domain={domain}
          clientId={clientId}
          existingData={assessment}
        />
      </div>
    )
  }

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-green-50 border-b border-green-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded">{domain}</span>
          <span className="text-sm font-semibold text-green-900">{DOMAIN_LABELS[domain]}</span>
          <span className="text-xs text-green-600">— {assessment.evaluation_date} 평가</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/print/assessment/${assessment.id}`}
            target="_blank"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            <Printer className="h-3 w-3" />
            출력
          </Link>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
          >
            <Pencil className="h-3 w-3" />
            수정
          </button>
        </div>
      </div>

      {/* Summary rows */}
      <div className="px-5 py-4 space-y-2">
        {renderSummaryRows(domain, data)}

        {assessment.evaluator_opinion && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500 mb-1">평가자 의견</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{assessment.evaluator_opinion}</p>
          </div>
        )}
        {assessment.recommended_device && (
          <div className="flex gap-2 text-sm pt-2">
            <span className="text-gray-500 w-32 shrink-0">추천 보조기기</span>
            <span className="text-blue-700 font-medium">{assessment.recommended_device}</span>
          </div>
        )}
        {assessment.future_plan && (
          <div className="flex gap-2 text-sm">
            <span className="text-gray-500 w-32 shrink-0">향후 계획</span>
            <span className="text-gray-700">{assessment.future_plan}</span>
          </div>
        )}
      </div>
    </div>
  )
}
