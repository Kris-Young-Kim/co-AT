import { getCallLogById, updateCallLog } from '@/actions/call-log-actions'
import { CallLogForm } from '@/eval/components/eval/CallLogForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default async function CallLogEditPage({ params }: EditPageProps) {
  const { id } = await params
  const result = await getCallLogById(id)
  if (!result.success || !result.log) notFound()

  async function handleUpdate(data: Parameters<typeof updateCallLog>[1]) {
    'use server'
    return updateCallLog(id, data)
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/call-logs" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">상담 일지 수정</h1>
      </div>
      <CallLogForm
        defaultValues={result.log}
        onSubmit={handleUpdate}
        submitLabel="수정 저장"
      />
    </div>
  )
}
