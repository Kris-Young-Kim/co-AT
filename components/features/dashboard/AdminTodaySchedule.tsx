"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type TodaySchedule } from "@/actions/dashboard-actions"
import { Calendar, Clock, MapPin, User, FileText } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface AdminTodayScheduleProps {
  schedules: TodaySchedule[]
}

const getScheduleTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    visit: "방문",
    consultation: "상담",
    assessment: "평가",
    delivery: "배송",
    pickup: "픽업",
    other: "기타",
  }
  return typeMap[type] || type
}

export function AdminTodaySchedule({ schedules }: AdminTodayScheduleProps) {
  if (schedules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>오늘의 일정</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            오늘 예정된 일정이 없습니다
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>오늘의 일정</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground">
                      {getScheduleTypeLabel(schedule.schedule_type)}
                    </span>
                  </div>
                  {schedule.client && (
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {schedule.client.name}
                      </span>
                    </div>
                  )}
                  {schedule.address && (
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate">
                        {schedule.address}
                      </span>
                    </div>
                  )}
                  {schedule.notes && (
                    <div className="flex items-start gap-2 mt-2">
                      <FileText className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {schedule.notes}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground whitespace-nowrap">
                  {schedule.scheduled_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {schedule.scheduled_time}
                    </div>
                  )}
                  {schedule.staff && (
                    <div className="text-xs text-muted-foreground">
                      {schedule.staff.full_name || "담당자"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

