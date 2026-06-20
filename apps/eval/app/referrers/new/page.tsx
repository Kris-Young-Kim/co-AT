import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReferrerForm } from '@/eval/components/referrers/ReferrerForm'

export default function NewReferrerPage() {
  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/referrers"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        의뢰처 목록
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">의뢰처 등록</h1>

      <div className="border rounded-lg p-6 bg-white">
        <ReferrerForm mode="create" />
      </div>
    </div>
  )
}
