import { getClientById, getNextRegistrationCode, getStaffMembers } from '@/actions/client-actions'
import { RegisterWizard } from '@/eval/components/eval/RegisterWizard'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface RegisterPageProps {
  params: Promise<{ clientId: string }>
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { clientId } = await params

  const [clientResult, staffMembers] = await Promise.all([
    getClientById(clientId),
    getStaffMembers(),
  ])

  if (!clientResult.success || !clientResult.client) notFound()
  const client = clientResult.client

  if (client.status !== 'pending') {
    redirect(`/clients/${clientId}`)
  }

  let nextCode = ''
  try {
    nextCode = await getNextRegistrationCode()
  } catch {
    // Fall back to year-only display; registerClient generates the real code on submit
    nextCode = `GW${new Date().getFullYear()}????`
  }

  return (
    <div className="p-8">
      <Link href="/clients/pending" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        접수 대기 목록
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">등록 처리</h1>
        <p className="text-gray-500 text-sm mt-1">
          {client.name}
          {client.birth_date ? ` · ${client.birth_date}` : ''}
        </p>
      </div>

      <RegisterWizard
        client={client}
        nextCode={nextCode}
        staffMembers={staffMembers}
      />
    </div>
  )
}
