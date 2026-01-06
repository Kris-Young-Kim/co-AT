"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getPublicSchedules, getPublicSchedulesByDate, type PublicSchedule } from "@/actions/schedule-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface HomeCalendarCompactProps {
  initialSchedules?: PublicSchedule[]
}

export function HomeCalendarCompact({ initialSchedules = [] }: HomeCalendarCompactProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [schedules, setSchedules] = useState<PublicSchedule[]>(initialSchedules)
  const [selectedSchedules, setSelectedSchedules] = useState<PublicSchedule[]>([])

  // 날짜 선택 시 해당 날짜의 일정 조회
  useEffect(() => {
    if (selectedDate) {
      getPublicSchedulesByDate(selectedDate).then(setSelectedSchedules)
    }
  }, [selectedDate])

  // 날짜에 일정이 있는지 확인하는 함수
  const hasSchedule = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd")
    return schedules.some((schedule) => schedule.scheduled_date === dateStr)
  }

  // 날짜 클릭 핸들러
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
    const dateStr = format(date, "yyyy-MM-dd")
    const daySchedules = schedules.filter(
      (schedule) => schedule.scheduled_date === dateStr
    )
    setSelectedSchedules(daySchedules)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarIcon className="h-5 w-5" aria-hidden="true" />
          공개 일정 캘린더
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 캘린더 */}
        <div className="w-full">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            modifiers={{
              hasSchedule: (date) => hasSchedule(date),
            }}
            modifiersClassNames={{
              hasSchedule: "bg-primary/10 text-primary font-semibold",
            }}
            className="rounded-md border w-full"
            aria-label="공개 일정 캘린더"
            classNames={{
              months: "w-full",
              month: "w-full",
              caption: "flex justify-center pt-1 relative items-center w-full",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              table: "w-full border-collapse space-y-1",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-sm text-center py-2 flex items-center justify-center",
              row: "flex w-full mt-2",
              cell: "flex-1 h-16 text-center text-sm p-0 relative flex items-center justify-center [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                buttonVariants({ variant: "ghost" }),
                "h-16 w-full p-0 font-normal aria-selected:opacity-100 text-base flex items-center justify-center"
              ),
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            }}
          />
        </div>

        {/* 선택된 날짜의 일정 목록 */}
        {selectedDate && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              {format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })} 일정
            </h3>
            {selectedSchedules.length === 0 ? (
              <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                선택한 날짜에 일정이 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-3 rounded-md border bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge
                        variant={
                          schedule.schedule_type === "exhibition"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {schedule.schedule_type === "exhibition" ? "견학" : "교육"}
                      </Badge>
                      {schedule.scheduled_time && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          <time dateTime={schedule.scheduled_time}>
                            {schedule.scheduled_time.substring(0, 5)}
                          </time>
                        </div>
                      )}
                    </div>
                    {schedule.address && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        <span className="line-clamp-1">{schedule.address}</span>
                      </div>
                    )}
                    {schedule.notes && (
                      <p className="text-xs text-foreground mt-1 line-clamp-2">
                        {schedule.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

