import { getInventoryList } from '@/actions/inventory-actions'
import { getOverdueRentals, getExpiringRentals, getRentals } from '@/actions/rental-actions'
import Link from 'next/link'
import { Package, ArrowLeftRight, AlertTriangle, Clock } from 'lucide-react'

export default async function InventoryDashboard() {
  const [inventoryResult, overdueResult, expiringResult, activeRentalsResult] = await Promise.all([
    getInventoryList({ limit: 1 }),
    getOverdueRentals(),
    getExpiringRentals(7),
    getRentals({ status: 'rented', limit: 1 }),
  ])

  const totalDevices = inventoryResult.success ? inventoryResult.total ?? 0 : 0
  const overdueCount = overdueResult.success ? (overdueResult.rentals ?? []).length : 0
  const expiringCount = expiringResult.success ? (expiringResult.rentals ?? []).length : 0
  const activeRentals = activeRentalsResult.success ? activeRentalsResult.total ?? 0 : 0

  const cards = [
    { label: '전체 기기', value: `${totalDevices}개`, href: '/devices', icon: Package, color: 'blue' },
    { label: '대여중', value: `${activeRentals}건`, href: '/rentals?status=rented', icon: ArrowLeftRight, color: 'green' },
    { label: '연체', value: `${overdueCount}건`, href: '/rentals?status=overdue', icon: AlertTriangle, color: 'red' },
    { label: '7일내 반납', value: `${expiringCount}건`, href: '/rentals?status=rented', icon: Clock, color: 'yellow' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">자산/재고 대시보드</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map(({ label, value, href, icon: Icon, color }) => (
          <Link
            key={label}
            href={href}
            className="border rounded-lg p-5 bg-white hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colorMap[color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/devices/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          기기 등록
        </Link>
        <Link
          href="/devices"
          className="px-4 py-2 border text-sm font-medium rounded-md hover:bg-gray-50"
        >
          기기 목록
        </Link>
        <Link
          href="/rentals"
          className="px-4 py-2 border text-sm font-medium rounded-md hover:bg-gray-50"
        >
          대여 관리
        </Link>
      </div>
    </div>
  )
}
