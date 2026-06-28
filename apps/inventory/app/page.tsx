export const dynamic = 'force-dynamic'

import { getInventoryList } from '@/actions/inventory-actions'
import { getOverdueRentals, getExpiringRentals, getRentals } from '@/actions/rental-actions'
import { getFabEquipment } from '@/actions/fab-equipment-actions'
import { RentalInlineActions } from '@/inventory/components/rental/RentalInlineActions'
import Link from 'next/link'
import { Package, ArrowLeftRight, AlertTriangle, Clock, Cpu, Phone } from 'lucide-react'

export default async function InventoryDashboard() {
  const [inventoryResult, overdueResult, expiringResult, activeRentalsResult, fabEquipmentResult] = await Promise.all([
    getInventoryList({ limit: 1 }),
    getOverdueRentals(),
    getExpiringRentals(7),
    getRentals({ status: 'rented', limit: 1 }),
    getFabEquipment(),
  ])

  const totalDevices = inventoryResult.success ? inventoryResult.total ?? 0 : 0
  const overdueRentals = overdueResult.success ? (overdueResult.rentals ?? []) : []
  const expiringRentals = expiringResult.success ? (expiringResult.rentals ?? []) : []
  const activeRentals = activeRentalsResult.success ? activeRentalsResult.total ?? 0 : 0
  const fabEquipmentList = fabEquipmentResult.success ? (fabEquipmentResult.equipment ?? []) : []
  const inUseCount = fabEquipmentList.filter((e) => e.status === 'in_use').length
  const availableCount = fabEquipmentList.filter((e) => e.status === 'available').length

  const cards = [
    { label: '전체 기기', value: `${totalDevices}개`, href: '/devices', icon: Package, color: 'blue' },
    { label: '대여중', value: `${activeRentals}건`, href: '/rentals?status=rented', icon: ArrowLeftRight, color: 'green' },
    { label: '연체', value: `${overdueRentals.length}건`, href: '/rentals?status=overdue', icon: AlertTriangle, color: overdueRentals.length > 0 ? 'red' : 'gray' },
    { label: '7일내 반납', value: `${expiringRentals.length}건`, href: '/rentals?status=rented', icon: Clock, color: expiringRentals.length > 0 ? 'yellow' : 'gray' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">자산/재고 대시보드</h1>

      {/* KPI 카드 */}
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

      {/* 연체 대여 패널 */}
      {overdueRentals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-base font-semibold text-red-700">연체 대여 {overdueRentals.length}건</h2>
          </div>
          <div className="border border-red-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-red-50 border-b border-red-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">기기명</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">대상자</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />연락처</span>
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">연체일수</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {overdueRentals.map(r => (
                  <tr key={r.id} className="bg-red-50/50">
                    <td className="px-4 py-3 font-medium">
                      {r.inventory_name ?? '—'}
                      {r.inventory_model && <span className="text-gray-400 ml-1 text-xs">{r.inventory_model}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.client_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.client_contact
                        ? <a href={`tel:${r.client_contact}`} className="hover:underline">{r.client_contact}</a>
                        : '—'
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-red-600 font-semibold">
                        {Math.abs(r.days_remaining ?? 0)}일 연체
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.rental_end_date ? (
                        <RentalInlineActions rentalId={r.id} currentEndDate={r.rental_end_date} />
                      ) : (
                        <Link href={`/rentals/${r.id}`} className="text-blue-600 hover:underline text-xs">상세</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 반납 임박 패널 */}
      {expiringRentals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h2 className="text-base font-semibold text-yellow-700">반납 임박 {expiringRentals.length}건 (7일 이내)</h2>
          </div>
          <div className="border border-yellow-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-yellow-50 border-b border-yellow-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">기기명</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">대상자</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />연락처</span>
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">반납 기한</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">남은 기간</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-100">
                {expiringRentals.map(r => (
                  <tr key={r.id} className="bg-yellow-50/30">
                    <td className="px-4 py-3 font-medium">
                      {r.inventory_name ?? '—'}
                      {r.inventory_model && <span className="text-gray-400 ml-1 text-xs">{r.inventory_model}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.client_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.client_contact
                        ? <a href={`tel:${r.client_contact}`} className="hover:underline">{r.client_contact}</a>
                        : '—'
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.rental_end_date}</td>
                    <td className="px-4 py-3">
                      {r.is_due_today
                        ? <span className="text-orange-600 font-semibold">오늘 반납</span>
                        : <span className="text-yellow-700 font-medium">{r.days_remaining}일 남음</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {r.rental_end_date ? (
                        <RentalInlineActions rentalId={r.id} currentEndDate={r.rental_end_date} />
                      ) : (
                        <Link href={`/rentals/${r.id}`} className="text-blue-600 hover:underline text-xs">상세</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 제작 장비 현황 */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">제작 장비 현황</h2>
        <Link
          href="/fab-equipment"
          className="inline-flex items-center gap-3 border rounded-lg bg-white p-5 hover:shadow-sm transition-shadow"
        >
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
            <Cpu className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-gray-900">
            {inUseCount}대 사용중 / {availableCount}대 유휴
          </p>
        </Link>
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
