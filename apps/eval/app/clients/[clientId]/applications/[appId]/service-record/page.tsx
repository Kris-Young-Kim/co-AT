import { getClientById } from '@/actions/client-actions'
import { ServiceRecordForm } from '@/eval/components/eval/ServiceRecordForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ clientId: string; appId: string }>
}

export default async function ServiceRecordPage({ params }: Props) {
  const { clientId, appId } = await params

  const clientResult = await getClientById(clientId)
  if (!clientResult.success || !clientResult.client) notFound()

  const client = clientResult.client
  const clientData = {
    name: client.name,
    birth_date: client.birth_date ?? null,
    gender: client.gender ?? null,
    disability_type: client.disability_type ?? null,
    disability_severity: client.disability_grade ?? null,
    economic_status: client.economic_status ?? null,
    region: null,
    contact: client.contact ?? null,
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href={`/clients/${clientId}/applications/${appId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        신청서로
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">서비스 기록 작성</h1>
      <ServiceRecordForm
        clientId={clientId}
        applicationId={appId}
        clientData={clientData}
        redirectTo={`/clients/${clientId}/applications/${appId}`}
      />
    </div>
  )
}
