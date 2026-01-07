"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, FileText, Wrench, Settings, Package } from "lucide-react"
import { type CustomMakeWithDetails } from "@/actions/custom-make-actions"
import { cn } from "@/lib/utils"

interface ProgressTrackerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customMake: CustomMakeWithDetails
  onProgressUpdate: (progress: {
    progress_status: string
    progress_percentage: number
    notes?: string
  }) => void
  isProcessing: boolean
}

const progressSteps = [
  { status: "design", label: "설계", icon: FileText, percentage: 25 },
  { status: "manufacturing", label: "제작", icon: Wrench, percentage: 50 },
  { status: "inspection", label: "검수", icon: Settings, percentage: 75 },
  { status: "delivery", label: "납품", icon: Package, percentage: 100 },
]

export function ProgressTracker({
  open,
  onOpenChange,
  customMake,
  onProgressUpdate,
  isProcessing,
}: ProgressTrackerProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(
    customMake.progress_status || "design"
  )
  const [notes, setNotes] = useState<string>("")

  const currentStepIndex = progressSteps.findIndex(
    (step) => step.status === customMake.progress_status
  )
  const currentStep = progressSteps[currentStepIndex] || progressSteps[0]

  const handleSubmit = () => {
    const selectedStep = progressSteps.find((step) => step.status === selectedStatus)
    if (selectedStep) {
      onProgressUpdate({
        progress_status: selectedStatus,
        progress_percentage: selectedStep.percentage,
        notes: notes || undefined,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>진행도 업데이트</DialogTitle>
          <DialogDescription>
            {customMake.item_name}의 제작 진행도를 업데이트합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 현재 진행도 */}
          <div className="space-y-2">
            <Label>현재 진행도</Label>
            <div className="space-y-2">
              <Progress value={customMake.progress_percentage || 0} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {currentStep.label} 단계
                </span>
                <span className="font-medium">
                  {customMake.progress_percentage || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* 진행 단계 표시 */}
          <div className="space-y-2">
            <Label>진행 단계</Label>
            <div className="grid grid-cols-4 gap-2">
              {progressSteps.map((step, index) => {
                const Icon = step.icon
                const isCompleted = index < currentStepIndex
                const isCurrent = index === currentStepIndex
                const isPending = index > currentStepIndex

                return (
                  <div
                    key={step.status}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border",
                      isCompleted && "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
                      isCurrent && "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
                      isPending && "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800"
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        isCompleted && "bg-green-500 text-white",
                        isCurrent && "bg-blue-500 text-white",
                        isPending && "bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium text-center",
                        isCompleted && "text-green-700 dark:text-green-300",
                        isCurrent && "text-blue-700 dark:text-blue-300",
                        isPending && "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 진행 상태 선택 */}
          <div className="space-y-2">
            <Label htmlFor="progress-status">진행 상태 변경</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="progress-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {progressSteps.map((step) => (
                  <SelectItem key={step.status} value={step.status}>
                    {step.label} ({step.percentage}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label htmlFor="notes">진행 메모</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="진행 내용을 입력하세요..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              "업데이트"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
