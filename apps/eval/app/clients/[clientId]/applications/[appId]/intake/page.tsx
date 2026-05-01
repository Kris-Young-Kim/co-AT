import { IntakeForm } from '@/eval/components/eval/IntakeForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface IntakePageProps {
  params: Promise<{ clientId: string; appId: string }>
}

export default async function IntakePage({ params }: IntakePageProps) {
  const { clientId, appId } = await params

  return (
    <div className="p-8 max-w-3xl">
      <Link href={`/clients/${clientId}/applications/${appId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        신청서로
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">상담 기록지</h1>
      <p className="text-sm text-gray-500 mb-8">첨부 19 — 보조기기 상담 기록</p>
      <IntakeForm clientId={clientId} applicationId={appId} />
    </div>
  )
}
