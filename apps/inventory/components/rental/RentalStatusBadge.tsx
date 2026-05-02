const STATUS_STYLES: Record<string, string> = {
  rented: 'bg-blue-100 text-blue-700',
  returned: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  damaged: 'bg-orange-100 text-orange-700',
}

const STATUS_LABELS: Record<string, string> = {
  rented: '대여중',
  returned: '반납완료',
  overdue: '연체',
  damaged: '손상',
}

export function RentalStatusBadge({ status }: { status: string | null }) {
  const s = status ?? 'rented'
  const cls = STATUS_STYLES[s] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {STATUS_LABELS[s] ?? s}
    </span>
  )
}
