"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPublicSchedules, getPublicSchedulesByDate, type PublicSchedule } from "@/actions/schedule-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { useAuth } from "@clerk/nextjs"
import { Calendar as CalendarIcon, MapPin, Clock, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface HomePublicCalendarProps {
  initialSchedules?: PublicSchedule[]
}

export function HomePublicCalendar({ initialSchedules = [] }: HomePublicCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [schedules, setSchedules] = useState<PublicSchedule[]>(initialSchedules)
  const [selectedSchedules, setSelectedSchedules] = useState<PublicSchedule[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [bookingSchedule, setBookingSchedule] = useState<PublicSchedule | null>(null)
  const { userId } = useAuth()
  const isSignedIn = !!userId

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
    if (daySchedules.length > 0) {
      setIsDialogOpen(true)
    }
  }

  // 예약 버튼 클릭 핸들러
  const handleBookingClick = (schedule: PublicSchedule) => {
    if (!isSignedIn) {
      // 로그인 페이지로 리다이렉트
      window.location.href = "/sign-in?redirect_url=/"
      return
    }
    setBookingSchedule(schedule)
    setIsBookingDialogOpen(true)
  }

  // 예약 확인 핸들러
  const handleConfirmBooking = async () => {
    if (!bookingSchedule || !isSignedIn) return

    try {
      // 견학/교육 예약을 위한 신청서 생성
      const response = await fetch("/api/applications/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedule_id: bookingSchedule.id,
          category: bookingSchedule.schedule_type === "exhibition" ? "experience" : "education",
          desired_date: bookingSchedule.scheduled_date,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert("예약이 완료되었습니다!")
        setIsBookingDialogOpen(false)
        // 페이지 새로고침하여 최신 일정 반영
        window.location.reload()
      } else {
        alert(data.error || "예약에 실패했습니다")
      }
    } catch (error) {
      console.error("예약 오류:", error)
      alert("예약 중 오류가 발생했습니다")
    }
  }

  return (
    <section id="calendar" className="py-12 sm:py-16 md:py-24 bg-muted/30 scroll-mt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-responsive-xl font-bold text-center text-foreground mb-8 sm:mb-12">
          공개 일정 캘린더
        </h2>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                견학 및 교육 일정
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                {/* 캘린더 */}
                <div className="flex-1">
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
                    className="rounded-md border"
                    classNames={{
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    }}
                  />
                </div>

                {/* 선택된 날짜의 일정 목록 */}
                {selectedDate && (
                  <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      {format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })} 일정
                    </h3>
                    {selectedSchedules.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        선택한 날짜에 일정이 없습니다.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedSchedules.map((schedule) => (
                          <Card
                            key={schedule.id}
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleDateSelect(selectedDate)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                      variant={
                                        schedule.schedule_type === "exhibition"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {schedule.schedule_type === "exhibition"
                                        ? "견학"
                                        : "교육"}
                                    </Badge>
                                  </div>
                                  {schedule.scheduled_time && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                      <Clock className="h-4 w-4" />
                                      {schedule.scheduled_time}
                                    </div>
                                  )}
                                  {schedule.address && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="h-4 w-4" />
                                      {schedule.address}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleBookingClick(schedule)
                                  }}
                                >
                                  예약
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 일정 상세 정보 모달 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>일정 상세 정보</DialogTitle>
            <DialogDescription>
              {selectedDate &&
                format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSchedules.map((schedule) => (
              <div key={schedule.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      schedule.schedule_type === "exhibition"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {schedule.schedule_type === "exhibition" ? "견학" : "교육"}
                  </Badge>
                </div>
                {schedule.scheduled_time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{schedule.scheduled_time}</span>
                  </div>
                )}
                {schedule.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{schedule.address}</span>
                  </div>
                )}
                {schedule.notes && (
                  <div className="flex items-start gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-foreground">{schedule.notes}</p>
                  </div>
                )}
                <Button
                  className="w-full mt-4"
                  onClick={() => {
                    setIsDialogOpen(false)
                    handleBookingClick(schedule)
                  }}
                >
                  예약하기
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 예약 확인 모달 */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>견학 예약 확인</DialogTitle>
            <DialogDescription>
              아래 일정으로 견학을 예약하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          {bookingSchedule && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">일정 유형</p>
                <Badge>
                  {bookingSchedule.schedule_type === "exhibition" ? "견학" : "교육"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">날짜</p>
                <p className="text-sm text-muted-foreground">
                  {format(
                    new Date(bookingSchedule.scheduled_date),
                    "yyyy년 MM월 dd일",
                    { locale: ko }
                  )}
                </p>
              </div>
              {bookingSchedule.scheduled_time && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">시간</p>
                  <p className="text-sm text-muted-foreground">
                    {bookingSchedule.scheduled_time}
                  </p>
                </div>
              )}
              {bookingSchedule.address && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">장소</p>
                  <p className="text-sm text-muted-foreground">
                    {bookingSchedule.address}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleConfirmBooking}>예약 확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

