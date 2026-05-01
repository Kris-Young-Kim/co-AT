export const dynamic = 'force-dynamic'

import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"
import { StatsDashboardContent } from "@/components/features/dashboard/StatsDashboardContent"

export default async function StatsPage() {
  // ê¶Œí•œ ?•ì¸
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    redirect("/")
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          ?µê³„ ?€?œë³´??        </h1>
        <p className="text-muted-foreground">
          5?€ ?µì‹¬ ?¬ì—… ?¤ì ???œëˆˆ???Œì•…?˜ê³ , ì§€?ì²´ ?ˆì‚° ?•ë³´ ?ë£Œë¡??œìš©?˜ì„¸??        </p>
      </div>

      <StatsDashboardContent />
    </div>
  )
}
