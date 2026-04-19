// app/(admin)/supplies/page.tsx
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { getSupplies } from "@/actions/supplies-actions"
import { SuppliesManagementContent } from "@/components/features/supplies/SuppliesManagementContent"

export const metadata = { title: "소모품 관리" }

export default async function SuppliesPage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) redirect("/")

  const result = await getSupplies()
  const supplies = result.success ? (result.supplies ?? []) : []

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <SuppliesManagementContent initialSupplies={supplies} />
    </div>
  )
}
