"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface SuccessModalProps {
  open: boolean
  applicationId?: string
  onClose: () => void
}

export function SuccessModal({ open, applicationId, onClose }: SuccessModalProps) {
  const router = useRouter()

  const handleGoToMyPage = () => {
    onClose()
    // window.location을 사용하여 전체 페이지 새로고침과 함께 이동
    window.location.href = "/portal/mypage"
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <DialogTitle className="text-center">신청이 완료되었습니다</DialogTitle>
          <DialogDescription className="text-center">
            서비스 신청이 정상적으로 접수되었습니다.
            {applicationId && (
              <span className="block mt-2 text-xs">
                신청번호: {applicationId.substring(0, 8)}...
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            닫기
          </Button>
          <Button onClick={handleGoToMyPage} className="w-full sm:w-auto">
            마이페이지로 이동
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

