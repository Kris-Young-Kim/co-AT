"use client"

import { Badge } from "@/components/ui/badge"
import { getScheduleLabel, getScheduleColorClass } from "@/lib/schedule-constants"
import { cn } from "@/lib/utils"

interface ScheduleBadgeProps {
  type: string
  className?: string
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export function ScheduleBadge({ type, className, variant }: ScheduleBadgeProps) {
  const label = getScheduleLabel(type)
  const colorClass = getScheduleColorClass(type)

  return (
    <Badge 
      variant={variant || "outline"} 
      className={cn(colorClass, className)}
    >
      {label}
    </Badge>
  )
}
