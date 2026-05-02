const STATUS_STYLES: Record<string, string> = {
  보관: 'bg-green-100 text-green-700',
  대여중: 'bg-blue-100 text-blue-700',
  수리중: 'bg-yellow-100 text-yellow-700',
  소독중: 'bg-purple-100 text-purple-700',
  폐기: 'bg-gray-100 text-gray-500',
}

export function DeviceStatusBadge({ status }: { status: string | null }) {
  const s = status ?? '—'
  const cls = STATUS_STYLES[s] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {s}
    </span>
  )
}
