import { getAllNotices } from "@/actions/notice-actions"
import { NoticeList } from "@/components/features/admin/notices/NoticeList"
import { NoticeCreateDialog } from "@/components/features/admin/notices/NoticeCreateDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"

export default async function AdminNoticesPage() {
  // ê¶Œí•œ ?•ì¸
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    console.log("[ê³µì??¬í•­ ê´€ë¦? ê¶Œí•œ ?†ìŒ - ?ˆìœ¼ë¡?ë¦¬ë‹¤?´ë ‰??)
    redirect("/")
  }
  
  console.log("[ê³µì??¬í•­ ê´€ë¦? ê¶Œí•œ ?•ì¸ ?„ë£Œ - ?˜ì´ì§€ ?Œë”ë§?)

  // ê³µì??¬í•­ ëª©ë¡ ì¡°íšŒ
  const result = await getAllNotices()
  const notices = result.success ? result.notices || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-responsive-xl font-bold text-foreground mb-2">
              ??ê¸€ ê´€ë¦?            </h1>
            <p className="text-muted-foreground">
              ê²Œì‹œê¸€???‘ì„±, ?˜ì •, ?? œ?????ˆìŠµ?ˆë‹¤
            </p>
          </div>
          <NoticeCreateDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              ??ê¸€ ?‘ì„±
            </Button>
          </NoticeCreateDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ê³µì??¬í•­ ëª©ë¡</CardTitle>
        </CardHeader>
        <CardContent>
          <NoticeList initialNotices={notices} />
        </CardContent>
      </Card>
    </div>
  )
}

