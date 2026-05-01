import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { getResources } from "@/actions/resource-actions"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { ResourceListWithCrud } from "@/components/features/resources/ResourceListWithCrud"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gwatc.cloud"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "?ë£Œ??,
  description: "ë³´ì¡°ê¸°ê¸° ê´€???ìƒ?ë£Œ ë°?ë¬¸ì„œ?ë£Œë¥??œê³µ?©ë‹ˆ??",
  openGraph: {
    title: "?ë£Œ??| GWATC ë³´ì¡°ê¸°ê¸°?¼í„°",
    description: "ë³´ì¡°ê¸°ê¸° ê´€???ìƒ?ë£Œ ë°?ë¬¸ì„œ?ë£Œë¥??œê³µ?©ë‹ˆ??",
    url: `${baseUrl}/info/resources`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/info/resources`,
  },
}

export default async function ResourcesPage() {
  const [resources, isStaff] = await Promise.all([
    getResources(),
    hasAdminOrStaffPermission(),
  ])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "ë³´ì¡°ê¸°ê¸° ?•ë³´", href: "/info" },
          { label: "?ë£Œ??, href: "/info/resources" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-8">?ë£Œ??/h1>
      <ResourceListWithCrud resources={resources} isStaff={isStaff} />
    </div>
  )
}
