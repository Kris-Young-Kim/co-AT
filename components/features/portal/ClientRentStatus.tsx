"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, differenceInDays, isPast, isToday } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { RentalStatus } from "@/actions/portal-actions"
import { Calendar, Package, AlertTriangle } from "lucide-react"

interface ClientRentStatusProps {
  rentals: RentalStatus[]
}

export function ClientRentStatus({ rentals }: ClientRentStatusProps) {
  if (rentals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            대여 중인 기기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            현재 대여 중인 기기가 없습니다
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          대여 중인 기기 ({rentals.length}개)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rentals.map((rental) => {
          const endDate = new Date(rental.rental_end_date)
          const daysRemaining = differenceInDays(endDate, new Date())
          const isOverdue = isPast(endDate) && !isToday(endDate)
          const isDueToday = isToday(endDate)

          return (
            <div
              key={rental.id}
              className={cn(
                "p-4 rounded-lg border",
                isOverdue && "border-destructive bg-destructive/5",
                isDueToday && "border-yellow-500 bg-yellow-500/10"
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {rental.inventory_name || "기기명 없음"}
                  </h3>
                  {rental.inventory_model && (
                    <p className="text-sm text-muted-foreground mt-1">
                      모델: {rental.inventory_model}
                    </p>
                  )}
                </div>
                {isOverdue && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    연체
                  </Badge>
                )}
                {isDueToday && (
                  <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-600 dark:text-yellow-500">
                    <AlertTriangle className="h-3 w-3" />
                    오늘 반납
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    대여 기간:{" "}
                    {format(new Date(rental.rental_start_date), "yyyy년 MM월 dd일", {
                      locale: ko,
                    })}{" "}
                    ~{" "}
                    {format(endDate, "yyyy년 MM월 dd일", { locale: ko })}
                  </span>
                </div>

                {rental.extension_count && rental.extension_count > 0 && (
                  <div className="text-xs text-muted-foreground">
                    연장 횟수: {rental.extension_count}회
                  </div>
                )}

                <div
                  className={cn(
                    "font-semibold",
                    isOverdue && "text-destructive",
                    isDueToday && "text-yellow-600 dark:text-yellow-500",
                    !isOverdue && !isDueToday && "text-foreground"
                  )}
                >
                  {isOverdue ? (
                    <span>연체 {Math.abs(daysRemaining)}일</span>
                  ) : isDueToday ? (
                    <span>오늘 반납 예정</span>
                  ) : (
                    <span>반납까지 {daysRemaining}일 남음</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

