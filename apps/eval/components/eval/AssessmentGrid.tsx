'use client'

import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import type { AssessmentDomainType } from './DomainSelector'
import { DOMAIN_LABELS } from './DomainSelector'

interface AssessmentRow {
  id: string
  domain_type: string
  evaluation_date: string
  evaluation_data: Record<string, unknown> | null
  evaluator_opinion: string | null
  recommended_device: string | null
  future_plan: string | null
}

interface Props {
  assessments: AssessmentRow[]
  clientId: string
  appId: string
}

const DOMAINS: AssessmentDomainType[] = ['WC', 'ADL', 'S', 'SP', 'EC', 'CA', 'L', 'AAC', 'AM']

function arr(v: unknown): string[] { return Array.isArray(v) ? (v as string[]) : [] }
function str(v: unknown): string { return v != null && v !== '' ? String(v) : '' }

function getSummaryPoints(domain: AssessmentDomainType, data: Record<string, unknown>): string[] {
  const pts: (string | null)[] = []
  switch (domain) {
    case 'WC':
      if (str(data.height) && str(data.weight)) pts.push(`${str(data.height)}cm / ${str(data.weight)}kg`)
      if (arr(data.needed_type).length) pts.push(arr(data.needed_type).join('·'))
      if (str(data.self_ambulatory)) pts.push(`자가보행: ${str(data.self_ambulatory).replace('보조인/보조기기 도움으로 가능', '도움필요')}`)
      break
    case 'ADL': {
      const ADL_KEYS = ['adl_grooming','adl_eating','adl_bathing','adl_dressing','adl_toilet','adl_bowel','adl_bladder'] as const
      const selfCount = ADL_KEYS.filter(k => str(data[k]) === '자가 수행 가능').length
      const aidCount  = ADL_KEYS.filter(k => str(data[k]).startsWith('보조')).length
      const depCount  = ADL_KEYS.filter(k => str(data[k]) === '완전 의존').length
      if (selfCount + aidCount + depCount > 0)
        pts.push(`자가 ${selfCount} · 보조 ${aidCount} · 의존 ${depCount}`)
      if (str(data.smart_device_owned)) pts.push(`스마트기기: ${str(data.smart_device_owned)}`)
      break
    }
    case 'S':
      if (str(data.vision_right_defect) && str(data.vision_right_defect) !== '없음')
        pts.push(`시각(우): ${str(data.vision_right_defect)}`)
      if (str(data.hearing_defect) && str(data.hearing_defect) !== '없음')
        pts.push(`청각: ${str(data.hearing_defect)}`)
      if (str(data.hearing_aid)) pts.push(`보청기: ${str(data.hearing_aid)}`)
      break
    case 'SP':
      if (str(data.main_posture)) pts.push(`활동자세: ${str(data.main_posture)}`)
      if (str(data.m_C)) pts.push(`엉덩오금 ${str(data.m_C)}cm`)
      if (str(data.m_G)) pts.push(`오금높이 ${str(data.m_G)}cm`)
      break
    case 'EC':
      if (str(data.housing_type)) pts.push(str(data.housing_type))
      if (str(data.modification_possible)) pts.push(`개조: ${str(data.modification_possible)}`)
      {
        const areas = [...arr(data.access_areas), ...arr(data.interior_areas), ...arr(data.sanitary_areas)]
        if (areas.length) pts.push(`개조영역 ${areas.length}곳`)
      }
      break
    case 'CA':
      if (str(data.pc_owned)) pts.push(`PC: ${str(data.pc_owned)}`)
      if (str(data.mouse_use)) pts.push(`마우스: ${str(data.mouse_use).replace('보조 도구와 함께 혹은 개조하여 사용','보조사용')}`)
      if (arr(data.body_part).length) pts.push(`부위: ${arr(data.body_part).slice(0,2).join('·')}`)
      break
    case 'L':
      if (arr(data.environment).length) pts.push(arr(data.environment).join('·'))
      if (str(data.sitting_balance)) pts.push(`착석균형: ${str(data.sitting_balance).replace('보조기기 있을 경우 가능','보조가능')}`)
      break
    case 'AAC':
      if (str(data.vocalization)) pts.push(`발성: ${str(data.vocalization)}`)
      if (arr(data.alt_means).length) pts.push(arr(data.alt_means).slice(0,2).join('·'))
      if (str(data.symbolization)) pts.push(`상징: ${str(data.symbolization)}`)
      break
    case 'AM':
      if (str(data.license)) pts.push(`면허: ${str(data.license)}`)
      if (str(data.vehicle_type)) pts.push(str(data.vehicle_type))
      {
        const needed = Object.keys(data).filter(k => k.startsWith('am_') && !k.endsWith('_detail') && str(data[k]) === '필요')
        if (needed.length) pts.push(`보조기기 ${needed.length}항목 필요`)
      }
      break
  }
  return pts.filter(Boolean) as string[]
}

export function AssessmentGrid({ assessments, clientId, appId }: Props) {
  const assessmentMap = new Map(
    assessments.map(a => [a.domain_type as AssessmentDomainType, a])
  )
  const completedCount = assessments.length

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${(completedCount / 9) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 shrink-0">
          {completedCount}/9 완료
        </span>
      </div>

      {/* Domain grid */}
      <div className="grid grid-cols-3 gap-3">
        {DOMAINS.map(domain => {
          const a = assessmentMap.get(domain)
          const done = !!a
          const pts = done && a.evaluation_data
            ? getSummaryPoints(domain, a.evaluation_data)
            : []

          return (
            <Link
              key={domain}
              href={`/clients/${clientId}/applications/${appId}/assessment?domain=${domain}`}
              className={`group rounded-lg border p-3 transition-all hover:shadow-md ${
                done
                  ? 'border-green-300 bg-green-50 hover:border-green-400'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <span className={`text-xs font-bold ${done ? 'text-green-700' : 'text-gray-400'}`}>
                    {domain}
                  </span>
                  <p className={`text-xs font-medium mt-0.5 leading-tight ${done ? 'text-green-900' : 'text-gray-500'}`}>
                    {DOMAIN_LABELS[domain]}
                  </p>
                </div>
                {done
                  ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  : <Circle className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                }
              </div>

              {done ? (
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-400">{a.evaluation_date}</p>
                  {pts.slice(0, 2).map((pt, i) => (
                    <p key={i} className="text-xs text-green-700 truncate">{pt}</p>
                  ))}
                  {a.recommended_device && (
                    <p className="text-xs text-blue-600 truncate">→ {a.recommended_device}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-1">미작성</p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
