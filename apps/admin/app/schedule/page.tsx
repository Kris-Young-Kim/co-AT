export const dynamic = 'force-dynamic'

import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"
import { getSchedules } from "@/actions/schedule-actions"
import { ScheduleManagementContent } from "@/components/features/schedule/ScheduleManagementContent"

export default async function SchedulePage() {
  // ê¶Œí•œ ?•ì¸
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    console.log("[?¼ì • ê´€ë¦? ê¶Œí•œ ?†ìŒ - ?ˆìœ¼ë¡?ë¦¬ë‹¤?´ë ‰??)
    redirect("/")
  }

  console.log("[?¼ì • ê´€ë¦? ê¶Œí•œ ?•ì¸ ?„ë£Œ - ?˜ì´ì§€ ?Œë”ë§?)

  // ?„ì¬ ?”ì˜ ?¼ì • ì¡°íšŒ
  const now = new Date()
  const result = await getSchedules(now.getFullYear(), now.getMonth() + 1)
  const initialSchedules = result.success ? result.data || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          ?¼ì • ê´€ë¦?        </h1>
        <p className="text-muted-foreground">
          ë°©ë¬¸, ?ë‹´, ?‰ê?, ë°°ì†¡, ?½ì—…, ê²¬í•™, êµìœ¡ ?¼ì •???±ë¡?˜ê³  ê´€ë¦¬í•  ???ˆìŠµ?ˆë‹¤.
          ê²¬í•™ ?ëŠ” êµìœ¡ ?¼ì •?€ ë©”ì¸?˜ì´ì§€ ìº˜ë¦°?”ì— ?ë™?¼ë¡œ ?œì‹œ?©ë‹ˆ??
        </p>
      </div>

      <ScheduleManagementContent initialSchedules={initialSchedules} />
    </div>
  )
}
