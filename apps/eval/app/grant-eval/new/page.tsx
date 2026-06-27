import { NewGrantAssessmentForm } from '@/eval/components/grant-eval/NewGrantAssessmentForm'
import { getClientById } from '@/actions/client-actions'
import { listReferrers } from '@/actions/referrer-actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  searchParams: Promise<{ clientId?: string }>
}

export default async function NewGrantEvalPage({ searchParams }: Props) {
  const { clientId } = await searchParams

  let preselectedClient: { id: string; name: string; birth_date: string | null; disability_type: string | null } | null = null
  if (clientId) {
    const result = await getClientById(clientId)
    if (result.success && result.client) {
      const c = result.client
      preselectedClient = { id: c.id, name: c.name, birth_date: c.birth_date ?? null, disability_type: c.disability_type ?? null }
    }
  }

  const referrersResult = await listReferrers({ is_active: true })
  const referrers = referrersResult.referrers ?? []

  return (
    <div className="p-8">
      <Link
        href={preselectedClient ? `/clients/${preselectedClient.id}` : '/grant-eval'}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {preselectedClient ? '대상자로 돌아가기' : '목록으로'}
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">교부사업 평가 등록</h1>
        {preselectedClient ? (
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-medium text-gray-800">{preselectedClient.name}</span> 대상자의 평가를 시작합니다
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">대상자 검색 후 평가를 시작합니다</p>
        )}
      </div>
      <NewGrantAssessmentForm initialClient={preselectedClient} referrers={referrers} />
    </div>
  )
}
