"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type StatsSummary } from "@/actions/stats-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Users, FileText, CheckCircle2, TrendingUp } from "lucide-react"

interface StatsSummaryCardProps {
  summary: StatsSummary
}

export function StatsSummaryCard({ summary }: StatsSummaryCardProps) {
  const {
    period,
    totalApplications,
    totalClients,
    totalCompleted,
    completionRate,
    businessSummary,
  } = summary

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 전체 신청 건수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 신청 건수</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalApplications.toLocaleString()}건</div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(period.startDate), "yyyy년 MM월 dd일", { locale: ko })} ~{" "}
            {format(new Date(period.endDate), "yyyy년 MM월 dd일", { locale: ko })}
          </p>
        </CardContent>
      </Card>

      {/* 대상자 수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">대상자 수</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalClients.toLocaleString()}명</div>
          <p className="text-xs text-muted-foreground">고유 대상자 수</p>
        </CardContent>
      </Card>

      {/* 완료 건수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">완료 건수</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCompleted.toLocaleString()}건</div>
          <p className="text-xs text-muted-foreground">완료율: {completionRate.toFixed(1)}%</p>
        </CardContent>
      </Card>

      {/* 완료율 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">완료율</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {totalCompleted}건 / {totalApplications}건
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
