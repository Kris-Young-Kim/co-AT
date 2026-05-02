import { getRentals, getOverdueRentals } from '@/actions/rental-actions'
import { RentalListTable } from '@/inventory/components/rental/RentalListTable'

interface RentalsPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function RentalsPage({ searchParams }: RentalsPageProps) {
  const params = await searchParams
  const status = params.status

  const [rentalsResult, overdueResult] = await Promise.all([
    getRentals({ status: status || undefined, limit: 100 }),
    getOverdueRentals(),
  ])

  const rentals = rentalsResult.success ? rentalsResult.rentals ?? [] : []
  const overdueCount = overdueResult.success ? (overdueResult.rentals ?? []).length : 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대여 관리</h1>
          {overdueCount > 0 && (
            <p className="text-sm text-red-600 mt-1 font-medium">연체 {overdueCount}건</p>
          )}
        </div>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2 mb-6">
        {[
          { value: '', label: '전체' },
          { value: 'rented', label: '대여중' },
          { value: 'overdue', label: '연체' },
          { value: 'returned', label: '반납완료' },
        ].map(opt => (
          <a
            key={opt.value}
            href={opt.value ? `?status=${opt.value}` : '/rentals'}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              (status ?? '') === opt.value
                ? 'bg-gray-800 text-white border-gray-800'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </a>
        ))}
      </div>

      <RentalListTable rentals={rentals} />
    </div>
  )
}
