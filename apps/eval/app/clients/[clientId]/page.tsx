import { getClientById } from '@/actions/client-actions'
import { getApplicationsByClientId } from '@/actions/application-actions'
import { ApplicationListCard } from '@/eval/components/eval/ApplicationListCard'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params

  const [clientResult, appsResult] = await Promise.all([
    getClientById(clientId),
    getApplicationsByClientId(clientId),
  ])

  if (!clientResult.success || !clientResult.client) notFound()

  const client = clientResult.client
  const applications = appsResult.success ? appsResult.applications ?? [] : []

  return (
    <div className="p-8">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      <div className="border rounded-lg p-6 mb-8 bg-white">
        <h1 className="text-xl font-bold text-gray-900 mb-4">{client.name}</h1>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">생년월일</dt>
            <dd className="font-medium mt-0.5">{client.birth_date ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">연락처</dt>
            <dd className="font-medium mt-0.5">{client.phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">장애유형</dt>
            <dd className="font-medium mt-0.5">{client.disability_type ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">등록일</dt>
            <dd className="font-medium mt-0.5">
              {client.created_at ? new Date(client.created_at).toLocaleDateString('ko-KR') : '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          신청서 ({applications.length}건)
        </h2>
        <ApplicationListCard applications={applications} clientId={clientId} />
      </div>
    </div>
  )
}
