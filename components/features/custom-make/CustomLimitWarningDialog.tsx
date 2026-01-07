"use client"

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
import { AlertTriangle } from "lucide-react"

interface CustomLimitWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentCount: number
  limit: number
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 맞춤제작 횟수 제한 경고 다이얼로그
 */
export function CustomLimitWarningDialog({
  open,
  onOpenChange,
  currentCount,
  limit,
  onConfirm,
  onCancel,
}: CustomLimitWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            맞춤제작 횟수 제한 경고
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 pt-2">
            <p>
              해당 대상자의 올해 맞춤제작 횟수가 <strong>{limit}회</strong> 제한에 도달했습니다.
            </p>
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>현재 사용 횟수:</span>
                  <strong className="text-destructive">{currentCount}회</strong>
                </div>
                <div className="flex justify-between">
                  <span>연간 제한:</span>
                  <strong>{limit}회</strong>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              맞춤제작은 연간 2회로 제한됩니다. 계속 진행하시겠습니까?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            계속 진행
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
