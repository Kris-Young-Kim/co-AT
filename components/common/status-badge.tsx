import { cn } from "@/lib/utils"

type ApplicationStatus = "접수" | "배정" | "진행" | "완료" | "반려"

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  접수: {
    label: "접수",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  },
  배정: {
    label: "배정",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  },
  진행: {
    label: "진행",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  },
  완료: {
    label: "완료",
    className: "bg-green-100 text-green-800 hover:bg-green-200",
  },
  반려: {
    label: "반려",
    className: "bg-red-100 text-red-800 hover:bg-red-200",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

