"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Schedule, getSchedules } from "@/actions/schedule-actions"

interface CalendarViewProps {
  initialSchedules?: Schedule[]
  onScheduleClick?: (schedule: Schedule) => void
  onDateClick?: (date: Date) => void
}

const scheduleTypeLabels: Record<string, string> = {
  visit: "방문",
  consult: "상담",
  assessment: "평가",
  delivery: "배송",
  pickup: "픽업",
  exhibition: "견학",
  education: "교육",
  custom_make: "맞춤제작",
}

const scheduleTypeColors: Record<string, string> = {
  visit: "bg-blue-100 text-blue-800",
  consult: "bg-green-100 text-green-800",
  assessment: "bg-purple-100 text-purple-800",
  delivery: "bg-orange-100 text-orange-800",
  pickup: "bg-yellow-100 text-yellow-800",
  exhibition: "bg-pink-100 text-pink-800",
  education: "bg-indigo-100 text-indigo-800",
  custom_make: "bg-teal-100 text-teal-800",
}

export function CalendarView({ initialSchedules = [], onScheduleClick, onDateClick }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // 일정 조회
  const fetchSchedules = async (year: number, month: number) => {
    setLoading(true)
    try {
      console.log("[캘린더 뷰] 일정 조회 시작:", year, month)
      const result = await getSchedules(year, month)
      if (result.success && result.data) {
        setSchedules(result.data)
        console.log("[캘린더 뷰] 일정 조회 성공:", result.data.length, "개")
      } else {
        console.error("[캘린더 뷰] 일정 조회 실패:", result.error)
        setSchedules([])
      }
    } catch (error) {
      console.error("[캘린더 뷰] 일정 조회 예외:", error)
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  // initialSchedules가 변경되면 업데이트
  useEffect(() => {
    if (initialSchedules.length > 0) {
      setSchedules(initialSchedules)
    }
  }, [initialSchedules])

  // 현재 날짜 변경 시 일정 조회 (initialSchedules가 없을 때만)
  useEffect(() => {
    if (initialSchedules.length === 0) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      fetchSchedules(year, month)
    }
  }, [currentDate, initialSchedules])

  // 날짜에 일정이 있는지 확인
  const getSchedulesForDate = (date: Date): Schedule[] => {
    const dateStr = format(date, "yyyy-MM-dd")
    return schedules.filter((schedule) => schedule.scheduled_date === dateStr)
  }

  // 날짜 클릭 핸들러
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      if (onDateClick) {
        onDateClick(date)
      }
    }
  }

  // 월 이동
  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  // 주간 뷰: 현재 주의 날짜들
  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { locale: ko })
    const end = endOfWeek(currentDate, { locale: ko })
    return eachDayOfInterval({ start, end })
  }

  // 일간 뷰: 선택된 날짜의 일정
  const daySchedules = selectedDate ? getSchedulesForDate(selectedDate) : []

  return (
    <div className="space-y-4">
      {/* 뷰 모드 선택 */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "month" | "week" | "day")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="month">월간</TabsTrigger>
          <TabsTrigger value="week">주간</TabsTrigger>
          <TabsTrigger value="day">일간</TabsTrigger>
        </TabsList>

        {/* 월간 뷰 */}
        <TabsContent value="month" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {format(currentDate, "yyyy년 MM월", { locale: ko })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousMonth}
                    disabled={loading}
                    aria-label="이전 달"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextMonth}
                    disabled={loading}
                    aria-label="다음 달"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={currentDate}
                onMonthChange={setCurrentDate}
                modifiers={{
                  hasSchedule: (date) => getSchedulesForDate(date).length > 0,
                }}
                modifiersClassNames={{
                  hasSchedule: "bg-primary/10 text-primary font-semibold",
                }}
                className="rounded-md border"
                locale={ko}
              />
              {selectedDate && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-semibold">
                    {format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })} 일정
                  </h3>
                  {getSchedulesForDate(selectedDate).length === 0 ? (
                    <p className="text-sm text-muted-foreground">일정이 없습니다</p>
                  ) : (
                    <div className="space-y-2">
                      {getSchedulesForDate(selectedDate).map((schedule) => (
                        <div
                          key={schedule.id}
                          className={cn(
                            "p-3 rounded-md border cursor-pointer hover:bg-accent transition-colors",
                            scheduleTypeColors[schedule.schedule_type] || "bg-gray-100"
                          )}
                          onClick={() => onScheduleClick?.(schedule)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {scheduleTypeLabels[schedule.schedule_type] || schedule.schedule_type}
                            </Badge>
                            <Badge
                              variant={
                                schedule.status === "completed"
                                  ? "default"
                                  : schedule.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {schedule.status === "completed"
                                ? "완료"
                                : schedule.status === "cancelled"
                                ? "취소"
                                : "예정"}
                            </Badge>
                          </div>
                          {schedule.scheduled_time && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <Clock className="h-3 w-3" />
                              <time dateTime={schedule.scheduled_time}>
                                {schedule.scheduled_time.substring(0, 5)}
                              </time>
                            </div>
                          )}
                          {schedule.address && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <MapPin className="h-3 w-3" />
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
        </TabsContent>

        {/* 주간 뷰 */}
        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {format(startOfWeek(currentDate, { locale: ko }), "yyyy년 MM월 dd일", {
                    locale: ko,
                  })}{" "}
                  ~ {format(endOfWeek(currentDate, { locale: ko }), "MM월 dd일", { locale: ko })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    disabled={loading}
                    aria-label="이전 주"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    disabled={loading}
                    aria-label="다음 주"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getWeekDays().map((day) => {
                  const daySchedules = getSchedulesForDate(day)
                  const isToday = isSameDay(day, new Date())
                  const isSelected = selectedDate && isSameDay(day, selectedDate)

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "p-4 rounded-md border",
                        isToday && "bg-primary/5 border-primary",
                        isSelected && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className={cn(
                            "text-sm font-semibold",
                            isToday && "text-primary"
                          )}
                        >
                          {format(day, "MM월 dd일 (E)", { locale: ko })}
                        </h3>
                        {daySchedules.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {daySchedules.length}개
                          </Badge>
                        )}
                      </div>
                      {daySchedules.length === 0 ? (
                        <p className="text-xs text-muted-foreground">일정이 없습니다</p>
                      ) : (
                        <div className="space-y-2">
                          {daySchedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              className={cn(
                                "p-2 rounded-md border cursor-pointer hover:bg-accent transition-colors text-xs",
                                scheduleTypeColors[schedule.schedule_type] || "bg-gray-100"
                              )}
                              onClick={() => {
                                setSelectedDate(day)
                                onScheduleClick?.(schedule)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="text-xs">
                                  {scheduleTypeLabels[schedule.schedule_type] ||
                                    schedule.schedule_type}
                                </Badge>
                                {schedule.scheduled_time && (
                                  <span className="text-muted-foreground">
                                    {schedule.scheduled_time.substring(0, 5)}
                                  </span>
                                )}
                              </div>
                              {schedule.notes && (
                                <p className="mt-1 line-clamp-1">{schedule.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 일간 뷰 */}
        <TabsContent value="day" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {selectedDate
                    ? format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })
                    : "날짜 선택"}
                </CardTitle>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border"
                  locale={ko}
                />
              </div>
            </CardHeader>
            <CardContent>
              {daySchedules.length === 0 ? (
                <p className="text-sm text-muted-foreground">일정이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {daySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={cn(
                        "p-4 rounded-md border cursor-pointer hover:bg-accent transition-colors",
                        scheduleTypeColors[schedule.schedule_type] || "bg-gray-100"
                      )}
                      onClick={() => onScheduleClick?.(schedule)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="secondary">
                          {scheduleTypeLabels[schedule.schedule_type] || schedule.schedule_type}
                        </Badge>
                        <Badge
                          variant={
                            schedule.status === "completed"
                              ? "default"
                              : schedule.status === "cancelled"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {schedule.status === "completed"
                            ? "완료"
                            : schedule.status === "cancelled"
                            ? "취소"
                            : "예정"}
                        </Badge>
                      </div>
                      {schedule.scheduled_time && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <Clock className="h-4 w-4" />
                          <time dateTime={schedule.scheduled_time}>
                            {schedule.scheduled_time.substring(0, 5)}
                          </time>
                        </div>
                      )}
                      {schedule.address && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>{schedule.address}</span>
                        </div>
                      )}
                      {schedule.notes && (
                        <p className="text-sm text-foreground mt-2">{schedule.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
