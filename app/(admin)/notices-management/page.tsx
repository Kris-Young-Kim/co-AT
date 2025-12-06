import { getAllNotices, deleteNotice } from "@/actions/notice-actions"
import { NoticeList } from "@/components/features/admin/notices/NoticeList"
import { NoticeCreateDialog } from "@/components/features/admin/notices/NoticeCreateDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"

export default async function AdminNoticesPage() {
  // 권한 확인
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    redirect("/")
  }

  // 공지사항 목록 조회
  const result = await getAllNotices()
  const notices = result.success ? result.notices || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-responsive-xl font-bold text-foreground mb-2">
              공지사항 관리
            </h1>
            <p className="text-muted-foreground">
              공지사항을 작성, 수정, 삭제할 수 있습니다
            </p>
          </div>
          <NoticeCreateDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 공지사항
            </Button>
          </NoticeCreateDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>공지사항 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <NoticeList initialNotices={notices} />
        </CardContent>
      </Card>
    </div>
  )
}

