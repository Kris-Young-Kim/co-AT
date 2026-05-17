import { PendingClientForm } from '@/eval/components/eval/PendingClientForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewClientPage() {
  return (
    <div className="p-8">
      <Link href="/clients/pending" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        접수 대기 목록
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">신규 클라이언트 접수</h1>
        <p className="text-gray-500 text-sm mt-1">임시 저장 후 접수 대기 목록에서 정식 등록할 수 있습니다</p>
      </div>
      <PendingClientForm />
    </div>
  )
}
