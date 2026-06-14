"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Schedule, getSchedules } from "@/actions/schedule-actions"
import { SCHEDULE_TYPE_LABELS, SCHEDULE_TYPE_COLORS, SCHEDULE_TYPE_HEX_COLORS, getScheduleColorClass } from "@/lib/schedule-constants"
import { ScheduleBadge } from "./ScheduleBadge"
import type { ScheduleCategory } from "@/actions/schedule-category-actions"
import { getHolidayName, isRedDay } from "./korean-holidays"

interface CalendarViewProps {
  initialSchedules?: Schedule[]
  categories?: ScheduleCategory[]
  onScheduleClick?: (schedule: Schedule) => void
  onDateClick?: (date: Date) => void
}

export function CalendarView({ initialSchedules = [], categories = [], onScheduleClick, onDateClick }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [mounted, setMounted] = useState(false)

  // 마운트 시 현재 날짜 설정 (하이드레이션 오류 방지)
  useEffect(() => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDate(now)
    setMounted(true)
  }, [])

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
    if (initialSchedules.length === 0 && currentDate) {
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

  // react-day-picker modifiers requires Date[], not a function
  const scheduleDates = useMemo(() =>
    schedules.map(s => {
      const parts = s.scheduled_date.split("-")
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    }),
    [schedules]
  )

  // Map date string → array of unique colors for dot rendering
  const dayColorMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const s of schedules) {
      const existing = map.get(s.scheduled_date) || []
      const cat = categories.find(c => c.id === s.category_id)
      const color = cat?.color ?? SCHEDULE_TYPE_HEX_COLORS[s.schedule_type as keyof typeof SCHEDULE_TYPE_HEX_COLORS] ?? "#6366f1"
      if (!existing.includes(color)) existing.push(color)
      map.set(s.scheduled_date, existing)
    }
    return map
  }, [schedules, categories])

  // Custom DayContent with holiday names and red coloring for weekends/holidays
  const DayContentWithDots = useMemo(() => {
    return function DayContent({ date }: { date: Date; displayMonth?: Date; activeModifiers?: Record<string, boolean> }) {
      const dateStr = format(date, "yyyy-MM-dd")
      const colors = dayColorMap.get(dateStr) || []
      const holidayName = getHolidayName(date)
      const red = isRedDay(date)
      return (
        <div className="flex flex-col items-center w-full py-0.5 gap-px">
          <span className={cn("leading-none text-sm font-medium", red && "text-red-500")}>
            {date.getDate()}
          </span>
          {holidayName && (
            <span className="text-[8px] leading-tight text-red-400 truncate w-full text-center px-0.5">
              {holidayName}
            </span>
          )}
          {colors.length > 0 && (
            <div className="flex items-center gap-0.5">
              {colors.slice(0, 3).map((color, i) => (
                <span
                  key={i}
                  className="block h-1 w-1 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
              {colors.length > 3 && (
                <span className="block h-1 w-1 rounded-full bg-muted-foreground/50" />
              )}
            </div>
          )}
        </div>
      )
    }
  }, [dayColorMap])

  // Unique categories that appear in current view (for legend)
  const activeCategoryIds = useMemo(() => {
    const ids = new Set(schedules.map(s => s.category_id).filter(Boolean) as string[])
    return categories.filter(c => ids.has(c.id))
  }, [schedules, categories])

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
    if (!currentDate) return
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    if (!currentDate) return
    setCurrentDate(addMonths(currentDate, 1))
  }

  // 주간 뷰: 현재 주의 날짜들
  const getWeekDays = () => {
    if (!currentDate) return []
    const start = startOfWeek(currentDate, { locale: ko })
    const end = endOfWeek(currentDate, { locale: ko })
    return eachDayOfInterval({ start, end })
  }

  // 일간 뷰: 선택된 날짜의 일정
  const daySchedules = selectedDate ? getSchedulesForDate(selectedDate) : []

  // 아직 마운트되지 않았거나 currentDate가 없으면 로딩 표시 또는 빈 화면 반환
  if (!mounted || !currentDate) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

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
                month={currentDate || undefined}
                onMonthChange={setCurrentDate}
                modifiers={{ hasSchedule: scheduleDates }}
                modifiersClassNames={{ hasSchedule: "font-semibold" }}
                components={{ DayContent: DayContentWithDots }}
                className="rounded-md border w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                  month: "space-y-4 w-full",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full",
                  head_cell: "rounded-md flex-1 font-normal text-sm text-center text-muted-foreground [&:first-child]:text-red-500 [&:last-child]:text-red-500",
                  row: "flex w-full mt-2",
                  cell: "flex-1 h-16 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-full w-full p-0 font-normal aria-selected:opacity-100 inline-flex items-start justify-center pt-1 rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
                }}
                locale={ko}
              />

              {/* Category legend */}
              {activeCategoryIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1">
                  {activeCategoryIds.map(cat => (
                    <div key={cat.id} className="flex items-center gap-1.5">
                      <span
                        className="block h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-muted-foreground">{cat.name}</span>
                    </div>
                  ))}
                </div>
              )}
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
                            SCHEDULE_TYPE_COLORS[schedule.schedule_type] || "bg-gray-100"
                          )}
                          onClick={() => onScheduleClick?.(schedule)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {(() => {
                                const cat = categories.find(c => c.id === schedule.category_id)
                                return cat ? (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                                    style={{ backgroundColor: cat.color }}
                                  >
                                    {cat.name}
                                  </span>
                                ) : null
                              })()}
                              <Badge variant="secondary" className="text-xs">
                                {schedule.schedule_type === "other" && schedule.custom_type_label
                                  ? schedule.custom_type_label
                                  : (SCHEDULE_TYPE_LABELS[schedule.schedule_type as keyof typeof SCHEDULE_TYPE_LABELS] || schedule.schedule_type)}
                              </Badge>
                            </div>
                            <Badge
                              variant={
                                schedule.status === "completed"
                                  ? "default"
                                  : schedule.status === "cancelled"
                                  ? "destructive"
                                  : schedule.status === "confirmed"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs shrink-0"
                            >
                              {schedule.status === "completed"
                                ? "완료"
                                : schedule.status === "cancelled"
                                ? "취소"
                                : schedule.status === "confirmed"
                                ? "확정"
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
                                getScheduleColorClass(schedule.schedule_type)
                              )}
                              onClick={() => {
                                setSelectedDate(day)
                                onScheduleClick?.(schedule)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <ScheduleBadge type={schedule.schedule_type} customLabel={schedule.custom_type_label ?? undefined} className="px-1 py-0 h-4" />
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
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                    month: "space-y-4 w-full",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full",
                    head_cell: "rounded-md flex-1 font-normal text-sm text-center text-muted-foreground [&:first-child]:text-red-500 [&:last-child]:text-red-500",
                    row: "flex w-full mt-2",
                    cell: "flex-1 h-16 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-full w-full p-0 font-normal aria-selected:opacity-100 inline-flex items-start justify-center pt-1 rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
                  }}
                  components={{ DayContent: DayContentWithDots }}
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
                        getScheduleColorClass(schedule.schedule_type)
                      )}
                      onClick={() => onScheduleClick?.(schedule)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <ScheduleBadge type={schedule.schedule_type} customLabel={schedule.custom_type_label ?? undefined} />
                        <Badge
                          variant={
                            schedule.status === "completed"
                              ? "default"
                              : schedule.status === "cancelled"
                              ? "destructive"
                              : schedule.status === "confirmed"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {schedule.status === "completed"
                            ? "완료"
                            : schedule.status === "cancelled"
                            ? "취소"
                            : schedule.status === "confirmed"
                            ? "확정"
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
