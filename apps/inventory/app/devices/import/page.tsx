import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DeviceImportClient } from '@/inventory/components/inventory/DeviceImportClient'

export const dynamic = 'force-dynamic'

export default function DeviceImportPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/devices" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">자산관리대장 가져오기</h1>
          <p className="text-sm text-gray-500 mt-0.5">Excel 파일에서 기기 목록을 일괄 등록합니다</p>
        </div>
      </div>
      <DeviceImportClient />
    </div>
  )
}
