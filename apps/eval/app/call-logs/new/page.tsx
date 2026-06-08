import { CallLogNewWithStt } from '@/eval/components/eval/CallLogNewWithStt'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CallLogNewPage() {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/call-logs" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">콜센터 상담 등록</h1>
      </div>
      <CallLogNewWithStt defaultDate={today} />
    </div>
  )
}
