import { getDomainAssessments } from '@/actions/assessment-actions'
import { DomainSelector } from '@/eval/components/eval/DomainSelector'
import { DomainAssessmentForm } from '@/eval/components/eval/DomainAssessmentForm'
import type { AssessmentDomainType } from '@/eval/components/eval/DomainSelector'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

interface AssessmentPageProps {
  params: Promise<{ clientId: string; appId: string }>
  searchParams: Promise<{ domain?: string }>
}

const VALID_DOMAINS: AssessmentDomainType[] = ['WC', 'ADL', 'S', 'SP', 'EC', 'CA', 'L', 'AAC', 'AM']

function isValidDomain(d: string | undefined): d is AssessmentDomainType {
  return VALID_DOMAINS.includes(d as AssessmentDomainType)
}

export default async function AssessmentPage({ params, searchParams }: AssessmentPageProps) {
  const { clientId, appId } = await params
  const { domain } = await searchParams

  const selectedDomain: AssessmentDomainType = isValidDomain(domain) ? domain : 'WC'

  const assessmentResult = await getDomainAssessments(appId)
  const assessments = assessmentResult.success ? assessmentResult.assessments ?? [] : []
  const completedDomains = assessments.map((a: { domain_type: string }) => a.domain_type) as AssessmentDomainType[]

  return (
    <div className="p-8 max-w-3xl">
      <Link href={`/clients/${clientId}/applications/${appId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        신청서로
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">영역별 평가</h1>
      <p className="text-sm text-gray-500 mb-8">
        첨부 21 — 영역을 선택하고 평가를 입력하세요 ({completedDomains.length}/9 완료)
      </p>

      <Suspense>
        <DomainSelector selectedDomain={selectedDomain} completedDomains={completedDomains} />
      </Suspense>

      <div className="border rounded-lg p-6 bg-white">
        <DomainAssessmentForm applicationId={appId} domain={selectedDomain} clientId={clientId} />
      </div>
    </div>
  )
}
