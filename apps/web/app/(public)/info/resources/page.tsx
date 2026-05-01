import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { getResources } from "@/actions/resource-actions"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { ResourceListWithCrud } from "@/components/features/resources/ResourceListWithCrud"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const revalidate = 300

export const metadata: Metadata = {
  title: "자료실",
  description: "보조기기 관련 영상자료 및 문서자료를 제공합니다.",
  openGraph: {
    title: "자료실 | GWATC 보조기기센터",
    description: "보조기기 관련 영상자료 및 문서자료를 제공합니다.",
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
          { label: "보조기기 정보", href: "/info" },
          { label: "자료실", href: "/info/resources" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-8">자료실</h1>
      <ResourceListWithCrud resources={resources} isStaff={isStaff} />
    </div>
  )
}
