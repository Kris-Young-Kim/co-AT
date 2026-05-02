import { getInventoryItem, updateInventoryItem } from '@/actions/inventory-actions'
import { DeviceForm } from '@/inventory/components/inventory/DeviceForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface DeviceEditPageProps {
  params: Promise<{ id: string }>
}

export default async function DeviceEditPage({ params }: DeviceEditPageProps) {
  const { id } = await params
  const result = await getInventoryItem(id)
  if (!result.success || !result.item) notFound()

  async function handleUpdate(data: Parameters<typeof updateInventoryItem>[1]) {
    'use server'
    return updateInventoryItem(id, data)
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/devices/${id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">기기 수정</h1>
      </div>
      <DeviceForm
        defaultValues={result.item}
        onSubmit={handleUpdate}
        submitLabel="수정 저장"
      />
    </div>
  )
}
