"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Edit } from "lucide-react"
import { ScheduleForm } from "./ScheduleForm"
import { CalendarView } from "./CalendarView"
import { type Schedule, deleteSchedule } from "@/actions/schedule-actions"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
interface ScheduleManagementContentProps {
  initialSchedules: Schedule[]
}

export function ScheduleManagementContent({
  initialSchedules,
}: ScheduleManagementContentProps) {
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 일정 폼 열기 (신규)
  const handleCreateClick = () => {
    setSelectedSchedule(null)
    setIsFormOpen(true)
  }

  // 일정 폼 열기 (수정)
  const handleEditClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setIsFormOpen(true)
  }

  // 일정 삭제 확인
  const handleDeleteClick = (schedule: Schedule) => {
    setDeleteTarget(schedule)
  }

  // 일정 삭제 실행
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      console.log("[일정 관리] 삭제 시작:", deleteTarget.id)
      const result = await deleteSchedule(deleteTarget.id)

      if (!result.success) {
        alert(result.error || "일정 삭제에 실패했습니다")
        console.error("[일정 관리] 삭제 실패:", result.error)
        return
      }

      console.log("[일정 관리] 삭제 성공:", deleteTarget.id)

      // 목록에서 제거
      setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setDeleteTarget(null)
      router.refresh()
    } catch (error) {
      console.error("[일정 관리] 삭제 예외:", error)
      alert("예상치 못한 오류가 발생했습니다")
    } finally {
      setIsDeleting(false)
    }
  }

  // 일정 폼 성공 콜백
  const handleFormSuccess = () => {
    router.refresh()
    // 페이지 새로고침으로 최신 데이터 가져오기
    window.location.reload()
  }

  // 캘린더에서 일정 클릭
  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 액션 버튼 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">일정 캘린더</h2>
          <p className="text-sm text-muted-foreground">
            일정을 클릭하면 수정할 수 있습니다
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          일정 등록
        </Button>
      </div>

      {/* 캘린더 뷰 */}
      <CalendarView
        initialSchedules={schedules}
        onScheduleClick={handleScheduleClick}
        onDateClick={(date) => {
          // 날짜 클릭 시 해당 날짜의 일정이 있으면 첫 번째 일정 선택
          const daySchedules = schedules.filter(
            (s) => s.scheduled_date === date.toISOString().split("T")[0]
          )
          if (daySchedules.length > 0) {
            handleScheduleClick(daySchedules[0])
          } else {
            // 일정이 없으면 새 일정 생성 (선택된 날짜로)
            setSelectedSchedule(null)
            setIsFormOpen(true)
          }
        }}
      />

      {/* 일정 폼 다이얼로그 */}
      <ScheduleForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        schedule={selectedSchedule}
        onSuccess={handleFormSuccess}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 일정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
