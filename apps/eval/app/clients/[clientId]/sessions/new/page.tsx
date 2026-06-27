import { getClientById } from '@/actions/client-actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AssessmentSessionFlow } from '@/eval/components/eval/AssessmentSessionFlow'

interface Props {
  params: Promise<{ clientId: string }>
}

export default async function NewAssessmentSessionPage({ params }: Props) {
  const { clientId } = await params
  const result = await getClientById(clientId)
  if (!result.success || !result.client) notFound()

  const client = result.client

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href={`/clients/${clientId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        대상자 정보로
      </Link>

      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">상담 및 영역 평가</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {client.name}
          {client.birth_date ? ` · ${client.birth_date}` : ''}
          {client.disability_type ? ` · ${client.disability_type}` : ''}
        </p>
      </div>

      <AssessmentSessionFlow clientId={clientId} clientName={client.name} />
    </div>
  )
}
