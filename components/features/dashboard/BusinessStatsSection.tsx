"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type DashboardStats } from "@/actions/dashboard-actions"
import {
  MessageSquare,
  Wrench,
  Package,
  GraduationCap,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BusinessStatsSectionProps {
  stats: DashboardStats["businessStats"]
}

export function BusinessStatsSection({ stats }: BusinessStatsSectionProps) {
  const businessCategories = [
    {
      id: "consultation",
      title: "I. 상담 및 정보제공사업",
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      borderColor: "border-blue-200 dark:border-blue-800",
      stats: stats.consultation,
      details: [
        { label: "상담", value: stats.consultation.total },
        { label: "체험지원", value: 0 }, // 체험은 experience 카테고리로 분리될 수 있음
      ],
    },
    {
      id: "customSupport",
      title: "II. 맞춤형 지원사업",
      icon: Wrench,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      borderColor: "border-green-200 dark:border-green-800",
      stats: stats.customSupport,
      details: [
        { label: "대여", value: stats.customSupport.rental },
        { label: "맞춤 제작", value: stats.customSupport.customMake },
        { label: "평가지원", value: stats.customSupport.assessment },
      ],
    },
    {
      id: "aftercare",
      title: "III. 사후관리 지원사업",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      borderColor: "border-orange-200 dark:border-orange-800",
      stats: stats.aftercare,
      details: [
        { label: "소독 및 세척", value: stats.aftercare.cleaning },
        { label: "점검 및 수리", value: stats.aftercare.repair },
        { label: "재사용 지원", value: stats.aftercare.reuse },
      ],
    },
    {
      id: "education",
      title: "IV. 교육 및 홍보사업",
      icon: GraduationCap,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      borderColor: "border-purple-200 dark:border-purple-800",
      stats: stats.education,
      details: [
        { label: "교육", value: stats.education.training },
        { label: "홍보", value: stats.education.promotion },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          4대 핵심 사업 현황
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          각 사업별 연간 실적 및 오늘의 현황을 확인하실 수 있습니다
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {businessCategories.map((category) => {
          const Icon = category.icon
          return (
            <Card
              key={category.id}
              className={cn("border-2", category.borderColor)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-foreground">
                    {category.title}
                  </CardTitle>
                  <div className={cn("rounded-full p-2", category.bgColor)}>
                    <Icon className={cn("h-5 w-5", category.color)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 주요 통계 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {category.stats.total}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      연간 총계
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {category.stats.today}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      오늘 접수
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {category.stats.inProgress}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      진행 중
                    </div>
                  </div>
                </div>

                {/* 세부 통계 */}
                <div className="pt-4 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    세부 현황
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.details.map((detail) => (
                      <Badge
                        key={detail.label}
                        variant="secondary"
                        className="text-xs"
                      >
                        {detail.label}: {detail.value}건
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 한도 체크 알림 (맞춤형 지원, 사후관리만) */}
                {(category.id === "customSupport" || category.id === "aftercare") && (
                  <div className="pt-2">
                    {category.id === "customSupport" && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>대여 한도: 연 3종 이하, 최대 1년</span>
                      </div>
                    )}
                    {category.id === "aftercare" && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>수리비 한도: 연 10만원 기준</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

