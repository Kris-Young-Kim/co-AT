import { Badge } from "@/components/ui/badge"

const CONFIG = {
  pending_review: { label: '검토 중', variant: 'outline' as const, className: 'border-amber-400 text-amber-600' },
  confirmed:      { label: '확정',   variant: 'outline' as const, className: 'border-green-500 text-green-600' },
  rejected:       { label: '반려',   variant: 'outline' as const, className: 'border-red-400 text-red-500' },
  cancelled:      { label: '취소',   variant: 'outline' as const, className: 'border-gray-300 text-gray-400' },
}

export function AppointmentStatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status as keyof typeof CONFIG] ?? CONFIG.pending_review
  return (
    <Badge variant={cfg.variant} className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}
