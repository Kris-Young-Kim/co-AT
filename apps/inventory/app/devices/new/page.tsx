import { createInventoryItem, type InventoryItem } from '@/actions/inventory-actions'
import { DeviceForm } from '@/inventory/components/inventory/DeviceForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

async function handleCreate(data: Partial<InventoryItem>) {
  'use server'
  return createInventoryItem(data as Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>)
}

export default function DeviceNewPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/devices" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">기기 등록</h1>
      </div>
      <DeviceForm onSubmit={handleCreate} submitLabel="등록" />
    </div>
  )
}
