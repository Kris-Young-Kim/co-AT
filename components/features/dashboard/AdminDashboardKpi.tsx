"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type DashboardStats } from "@/actions/dashboard-actions"
import { FileText, Clock, CheckCircle2 } from "lucide-react"

interface AdminDashboardKpiProps {
  stats: DashboardStats
}

export function AdminDashboardKpi({ stats }: AdminDashboardKpiProps) {
  const kpiItems = [
    {
      title: "오늘의 신규 접수",
      value: stats.newToday,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "진행 중",
      value: stats.inProgress,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      title: "오늘 완료",
      value: stats.completedToday,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {kpiItems.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${item.bgColor}`}>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-1">건</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

