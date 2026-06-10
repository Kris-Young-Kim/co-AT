import { getGrantAssessmentById } from '@/actions/grant-assessment-actions'
import { getClientById } from '@/actions/client-actions'
import { getChecklistTemplates } from '@/actions/checklist-template-actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { GrantAssessmentBasicForm } from '@/eval/components/grant-eval/GrantAssessmentBasicForm'
import { GrantItemsForm } from '@/eval/components/grant-eval/GrantItemsForm'
import { GrantSuitabilityForm } from '@/eval/components/grant-eval/GrantSuitabilityForm'
import { GrantOpinionForm } from '@/eval/components/grant-eval/GrantOpinionForm'
import { GrantResultForm } from '@/eval/components/grant-eval/GrantResultForm'
import { InterviewVoiceFill } from '@/eval/components/grant-eval/InterviewVoiceFill'
import type { ChecklistItem } from '@/eval/components/grant-eval/ChecklistSection'

const TABS = [
  { key: 'basic', label: '기본정보' },
  { key: 'items', label: '신청품목' },
  { key: 'suitability', label: '적정성 평가' },
  { key: 'opinion', label: '종합의견' },
  { key: 'result', label: '평가결과' },
] as const

type TabKey = typeof TABS[number]['key']

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}
const STATUS_LABEL: Record<string, string> = { draft: '작성중', submitted: '제출됨', completed: '완료' }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function GrantAssessmentDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const tab: TabKey = (TABS.find((t) => t.key === sp.tab)?.key ?? 'basic') as TabKey

  const result = await getGrantAssessmentById(id)
  if (!result.success || !result.assessment) notFound()

  const assessment = result.assessment
  const clientResult = await getClientById(assessment.client_id)
  const client = clientResult.success ? clientResult.client : null

  let checklistMap: Record<string, ChecklistItem[]> = {}
  if (tab === 'opinion') {
    const entries = await Promise.all(
      assessment.items.map(async (item) => {
        const r = await getChecklistTemplates(item.item_category)
        return [item.item_category, r.templates ?? []] as [string, ChecklistItem[]]
      })
    )
    checklistMap = Object.fromEntries(entries)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/grant-eval" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
        <Link
          href={`/print/grant-eval/${id}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 border rounded-md hover:bg-gray-50"
        >
          <Printer className="h-4 w-4" />
          인쇄
        </Link>
      </div>

      {/* 헤더 */}
      <div className="border rounded-lg p-5 mb-6 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {client?.name ?? '—'} · {assessment.assessment_year}년 교부사업 평가
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {client?.birth_date ?? '—'} · {(client as any)?.disability_type ?? '장애유형 없음'}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[assessment.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[assessment.status] ?? assessment.status}
          </span>
        </div>
      </div>

      {/* 인터뷰 음성 자동 채우기 */}
      <div className="mb-6">
        <InterviewVoiceFill
          assessmentId={id}
          existingItems={assessment.items.map((i) => ({ item_order: i.item_order, item_category: i.item_category }))}
        />
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/grant-eval/${id}?tab=${t.key}`}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === 'basic' && (
        <GrantAssessmentBasicForm assessmentId={id} assessment={assessment} />
      )}
      {tab === 'items' && (
        <GrantItemsForm assessmentId={id} items={assessment.items} />
      )}
      {tab === 'suitability' && (
        <GrantSuitabilityForm assessmentId={id} items={assessment.items} />
      )}
      {tab === 'opinion' && (
        <GrantOpinionForm assessmentId={id} assessment={assessment} checklistMap={checklistMap} />
      )}
      {tab === 'result' && (
        <GrantResultForm assessmentId={id} assessment={assessment} />
      )}
    </div>
  )
}
