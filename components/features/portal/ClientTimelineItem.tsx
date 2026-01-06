"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { ServiceHistory } from "@/actions/portal-actions"
import {
  MessageSquare,
  TestTube,
  Wrench,
  Heart,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  Scissors,
  Recycle,
  Settings,
  Droplets,
} from "lucide-react"

// 서비스 타입별 아이콘 및 라벨
const serviceTypeConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; color: string }
> = {
  // Service Log 타입
  repair: { icon: Wrench, label: "수리 및 점검", color: "text-blue-600" },
  custom_make: { icon: Scissors, label: "맞춤 제작", color: "text-purple-600" },
  cleaning: { icon: Droplets, label: "소독 및 세척", color: "text-green-600" },
  reuse: { icon: Recycle, label: "재사용 지원", color: "text-orange-600" },
  inspection: { icon: Settings, label: "점검", color: "text-blue-600" },
  maintenance: { icon: Settings, label: "유지관리", color: "text-gray-600" },
  education: { icon: GraduationCap, label: "교육", color: "text-indigo-600" },
  rental: { icon: Package, label: "대여", color: "text-cyan-600" },
  // Application 카테고리
  consult: { icon: MessageSquare, label: "상담 및 정보제공", color: "text-primary" },
  experience: { icon: TestTube, label: "체험", color: "text-primary" },
  custom: { icon: Wrench, label: "맞춤형 지원", color: "text-primary" },
  aftercare: { icon: Heart, label: "사후관리", color: "text-primary" },
  // 기타
  intake: { icon: MessageSquare, label: "상담", color: "text-primary" },
}

const categoryLabels: Record<string, string> = {
  consult: "상담 및 정보제공",
  experience: "체험",
  custom: "맞춤형 지원",
  aftercare: "사후관리",
  education: "교육/홍보",
}

const subCategoryLabels: Record<string, string> = {
  repair: "수리",
  rental: "대여",
  custom_make: "맞춤 제작",
  visit: "방문",
  exhibition: "견학",
  cleaning: "소독/세척",
  reuse: "재사용",
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }
> = {
  접수: {
    label: "접수",
    variant: "secondary",
    icon: Clock,
  },
  배정: {
    label: "배정",
    variant: "default",
    icon: AlertCircle,
  },
  진행: {
    label: "진행 중",
    variant: "default",
    icon: Clock,
  },
  완료: {
    label: "완료",
    variant: "default",
    icon: CheckCircle2,
  },
  반려: {
    label: "반려",
    variant: "destructive",
    icon: XCircle,
  },
  rented: {
    label: "대여 중",
    variant: "default",
    icon: Package,
  },
  returned: {
    label: "반납 완료",
    variant: "default",
    icon: CheckCircle2,
  },
  overdue: {
    label: "연체",
    variant: "destructive",
    icon: AlertCircle,
  },
}

interface ClientTimelineItemProps {
  history: ServiceHistory
}

export function ClientTimelineItem({ history }: ClientTimelineItemProps) {
  // 타입별 아이콘 및 라벨 결정
  let Icon: React.ComponentType<{ className?: string }> = MessageSquare
  let label = "서비스"
  let color = "text-primary"

  if (history.type === "service_log" && history.service_type) {
    const config = serviceTypeConfig[history.service_type]
    if (config) {
      Icon = config.icon
      label = config.label
      color = config.color
    } else {
      Icon = Settings
      label = history.service_type
    }
  } else if (history.type === "rental") {
    Icon = Package
    label = "대여"
    color = "text-cyan-600"
  } else if (history.type === "intake") {
    Icon = MessageSquare
    label = "상담"
    color = "text-primary"
  } else if (history.type === "application" && history.category) {
    const config = serviceTypeConfig[history.category]
    if (config) {
      Icon = config.icon
      label = config.label
      color = config.color
    } else {
      label = categoryLabels[history.category] || history.category
    }
  }

  // 상태 표시
  let statusBadge = null
  if (history.type === "application" && history.status) {
    const statusInfo = statusConfig[history.status] || statusConfig["접수"]
    const StatusIcon = statusInfo.icon
    statusBadge = (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <StatusIcon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    )
  } else if (history.type === "rental" && history.status) {
    const statusInfo = statusConfig[history.status] || statusConfig["rented"]
    const StatusIcon = statusInfo.icon
    statusBadge = (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <StatusIcon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    )
  } else if (history.type === "service_log") {
    statusBadge = (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        완료
      </Badge>
    )
  } else if (history.type === "intake") {
    statusBadge = (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        상담 완료
      </Badge>
    )
  }

  // 세부 정보
  const subLabel =
    history.type === "application" && history.sub_category
      ? subCategoryLabels[history.sub_category] || history.sub_category
      : history.type === "service_log" && history.item_name
      ? history.item_name
      : history.type === "rental" && history.inventory_name
      ? history.inventory_name
      : null

  return (
    <Card className="relative">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          {/* 아이콘 */}
          <div className="flex-shrink-0">
            <div className={cn("p-3 rounded-lg bg-primary/10", color)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-foreground">{label}</h3>
                {subLabel && (
                  <p className="text-sm text-muted-foreground mt-1">{subLabel}</p>
                )}
                {history.type === "service_log" && history.work_description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {history.work_description}
                  </p>
                )}
              </div>
              {statusBadge}
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              {/* 날짜 표시 */}
              {history.type === "rental" && history.rental_start_date && (
                <div className="flex items-center gap-1">
                  <span>대여 기간:</span>
                  <span>
                    {format(new Date(history.rental_start_date), "yyyy년 MM월 dd일", {
                      locale: ko,
                    })}
                    {history.rental_end_date && (
                      <>
                        {" ~ "}
                        {format(new Date(history.rental_end_date), "yyyy년 MM월 dd일", {
                          locale: ko,
                        })}
                      </>
                    )}
                  </span>
                </div>
              )}
              {history.type === "intake" && history.consult_date && (
                <div className="flex items-center gap-1">
                  <span>상담일:</span>
                  <span>
                    {format(new Date(history.consult_date), "yyyy년 MM월 dd일", {
                      locale: ko,
                    })}
                  </span>
                </div>
              )}
              {history.type === "service_log" && history.service_date && (
                <div className="flex items-center gap-1">
                  <span>서비스일:</span>
                  <span>
                    {format(new Date(history.service_date), "yyyy년 MM월 dd일", {
                      locale: ko,
                    })}
                  </span>
                </div>
              )}
              {history.type === "application" && history.desired_date && (
                <div className="flex items-center gap-1">
                  <span>희망일:</span>
                  <span>
                    {format(new Date(history.desired_date), "yyyy년 MM월 dd일", {
                      locale: ko,
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span>
                  {history.type === "application"
                    ? "신청일"
                    : history.type === "service_log"
                    ? "등록일"
                    : history.type === "rental"
                    ? "대여 시작일"
                    : "등록일"}
                  :
                </span>
                <span>
                  {history.date
                    ? format(new Date(history.date), "yyyy년 MM월 dd일", { locale: ko })
                    : history.created_at
                    ? format(new Date(history.created_at), "yyyy년 MM월 dd일", {
                        locale: ko,
                      })
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
