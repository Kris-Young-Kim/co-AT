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

interface CustomMakeCostLimitWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTotal: number
  newAmount: number
  newTotal: number
  limit: number
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 맞춤제작비 한도 경고 다이얼로그
 */
export function CustomMakeCostLimitWarningDialog({
  open,
  onOpenChange,
  currentTotal,
  newAmount,
  newTotal,
  limit,
  onConfirm,
  onCancel,
}: CustomMakeCostLimitWarningDialogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount)
  }

  const exceededAmount = newTotal > limit ? newTotal - limit : 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            맞춤제작비 한도 초과 경고
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 pt-2">
            <p>
              해당 대상자의 올해 맞춤제작비(재료비) 누적 금액이 <strong>{formatCurrency(limit)}</strong> 한도를 초과합니다.
            </p>
            <div className="rounded-lg border p-3 bg-muted/50 space-y-2">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>현재 누적 재료비:</span>
                  <strong>{formatCurrency(currentTotal)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>신규 재료비:</span>
                  <strong>{formatCurrency(newAmount)}</strong>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span>합계:</span>
                  <strong className="text-destructive">{formatCurrency(newTotal)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>연간 한도:</span>
                  <strong>{formatCurrency(limit)}</strong>
                </div>
                {exceededAmount > 0 && (
                  <div className="flex justify-between text-destructive font-semibold">
                    <span>초과 금액:</span>
                    <strong>{formatCurrency(exceededAmount)}</strong>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              맞춤제작비(재료비)는 연간 10만원으로 제한됩니다. 초과 금액은 자부담입니다. 계속 진행하시겠습니까?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            계속 진행 (초과분 자부담)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
