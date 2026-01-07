"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { RentalStatus } from "@/actions/portal-actions"
import type { CustomMakeStatus } from "@/actions/portal-actions"
import type { ReuseServiceStatus } from "@/actions/portal-actions"
import { Calendar, Package, Wrench, AlertCircle, Recycle } from "lucide-react"

interface ClientServiceHistoryProps {
  rentals: RentalStatus[]
  customMakes: CustomMakeStatus[]
  reuseServices: ReuseServiceStatus[]
}

export function ClientServiceHistory({ rentals, customMakes, reuseServices }: ClientServiceHistoryProps) {
  const hasData = rentals.length > 0 || customMakes.length > 0 || reuseServices.length > 0

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            서비스 이력
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            대여, 맞춤제작 및 재사용 기기 지원 이력이 없습니다
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
          서비스 이력
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 대여 이력 */}
        {rentals.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">대여 기기</h4>
            {rentals.map((rental) => (
              <div
                key={`rental-${rental.id}`}
                className="p-4 rounded-lg border bg-muted/50"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground">
                        {rental.inventory_name || "기기명 없음"}
                      </h3>
                    </div>
                    {rental.inventory_model && (
                      <p className="text-sm text-muted-foreground">
                        모델: {rental.inventory_model}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    대여
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(rental.rental_start_date), "yyyy.MM.dd", {
                        locale: ko,
                      })}{" "}
                      ~{" "}
                      {rental.rental_end_date
                        ? format(new Date(rental.rental_end_date), "yyyy.MM.dd", {
                            locale: ko,
                          })
                        : "진행 중"}
                    </span>
                  </div>
                  {rental.status && (
                    <div>
                      <Badge
                        variant={
                          rental.status === "rented"
                            ? "default"
                            : rental.status === "returned"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {rental.status === "rented"
                          ? "대여 중"
                          : rental.status === "returned"
                          ? "반납 완료"
                          : rental.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 맞춤제작 이력 */}
        {customMakes.length > 0 && (
          <div className="space-y-3">
            {(rentals.length > 0 || reuseServices.length > 0) && <hr className="my-4" />}
            <h4 className="text-sm font-semibold text-foreground">맞춤제작 기기</h4>
            {customMakes.map((customMake) => {
              const progressLabels: Record<string, string> = {
                design: "설계",
                manufacturing: "제작",
                inspection: "검수",
                delivery: "납품",
                completed: "완료",
                cancelled: "취소",
              }

              const progressColors: Record<string, string> = {
                design: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
                manufacturing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
                inspection: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
                delivery: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
                cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
              }

              return (
                <div
                  key={`custom-${customMake.id}`}
                  className="p-4 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground">
                          {customMake.item_name}
                        </h3>
                      </div>
                      {customMake.item_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {customMake.item_description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      맞춤제작
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {customMake.progress_status && (
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-xs",
                            progressColors[customMake.progress_status] ||
                              "bg-gray-100 text-gray-800"
                          )}
                        >
                          {progressLabels[customMake.progress_status] ||
                            customMake.progress_status}
                        </Badge>
                        {customMake.progress_percentage !== null && (
                          <span className="text-xs text-muted-foreground">
                            {customMake.progress_percentage}%
                          </span>
                        )}
                      </div>
                    )}
                    {customMake.expected_completion_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          예상 완료일:{" "}
                          {format(
                            new Date(customMake.expected_completion_date),
                            "yyyy.MM.dd",
                            { locale: ko }
                          )}
                        </span>
                      </div>
                    )}
                    {customMake.delivery_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          납품일:{" "}
                          {format(new Date(customMake.delivery_date), "yyyy.MM.dd", {
                            locale: ko,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 재사용 기기 지원 이력 */}
        {reuseServices.length > 0 && (
          <div className="space-y-3">
            {(rentals.length > 0 || customMakes.length > 0) && <hr className="my-4" />}
            <h4 className="text-sm font-semibold text-foreground">재사용 기기 지원</h4>
            {reuseServices.map((reuse) => (
              <div
                key={`reuse-${reuse.id}`}
                className="p-4 rounded-lg border bg-muted/50"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Recycle className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground">
                        {reuse.item_name || "재사용 기기"}
                      </h3>
                    </div>
                    {reuse.work_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {reuse.work_description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    재사용
                  </Badge>
                </div>
                <div className="space-y-2">
                  {reuse.service_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        서비스 일자:{" "}
                        {format(new Date(reuse.service_date), "yyyy.MM.dd", {
                          locale: ko,
                        })}
                      </span>
                    </div>
                  )}
                  {reuse.work_result && (
                    <div className="text-sm">
                      <span className="font-medium text-foreground">결과: </span>
                      <span className="text-muted-foreground">{reuse.work_result}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
