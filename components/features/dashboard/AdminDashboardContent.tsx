"use client"

import { AdminDashboardKpi } from "./AdminDashboardKpi"
import { AdminNewRequestList } from "./AdminNewRequestList"
import { AdminTodaySchedule } from "./AdminTodaySchedule"
import { BusinessStatsSection } from "./BusinessStatsSection"
import { RentalAlerts } from "./RentalAlerts"
import { PrivacyRetentionAlerts } from "./PrivacyRetentionAlerts"
import { useDashboardStats, useNewApplications, useTodaySchedules } from "@/lib/hooks/useDashboardStats"
import { Loader2 } from "lucide-react"

export function AdminDashboardContent() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: applications, isLoading: applicationsLoading } = useNewApplications(10)
  const { data: schedules, isLoading: schedulesLoading } = useTodaySchedules()

  if (statsLoading || applicationsLoading || schedulesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (statsError || !stats) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          대시보드 데이터를 불러오는 중 오류가 발생했습니다
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <AdminDashboardKpi stats={stats} />

      {/* 대여 알림 */}
      <RentalAlerts />

      {/* 개인정보 보유 기간 알림 */}
      <PrivacyRetentionAlerts />

      {/* 4대 핵심 사업 현황 */}
      <BusinessStatsSection stats={stats.businessStats} />

      {/* 신규 접수 및 오늘의 일정 */}
      <div className="grid gap-6 md:grid-cols-2">
        <AdminNewRequestList applications={applications || []} />
        <AdminTodaySchedule schedules={schedules || []} />
      </div>
    </div>
  )
}

