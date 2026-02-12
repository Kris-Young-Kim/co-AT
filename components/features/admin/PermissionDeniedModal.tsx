"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export function PermissionDeniedModal() {
  const [open, setOpen] = useState(true)
  const router = useRouter()

  const handleClose = () => {
    setOpen(false)
    router.push("/admin/dashboard")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <DialogTitle>접근 권한 없음</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            이 페이지는 관리자(admin) 또는 매니저(manager)만 접근할 수 있습니다.
            <br />
            현재 계정에는 해당 권한이 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose}>대시보드로 이동</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

