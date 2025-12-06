import { cn } from "@/lib/utils"

type ApplicationStatus = "접수" | "배정" | "진행" | "완료" | "반려"

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  접수: {
    label: "접수",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50",
  },
  배정: {
    label: "배정",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50",
  },
  진행: {
    label: "진행",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50",
  },
  완료: {
    label: "완료",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50",
  },
  반려: {
    label: "반려",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50",
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

