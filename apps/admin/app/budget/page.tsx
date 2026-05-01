// app/(admin)/budget/page.tsx
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { getBudgetsWithActual } from "@/actions/budget-actions"
import { BudgetContent } from "@/components/features/budget/BudgetContent"

export const metadata = { title: "예산 계획" }

export default async function BudgetPage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) redirect("/")

  const year = new Date().getFullYear()
  const result = await getBudgetsWithActual(year)

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <BudgetContent
        initialData={result.data ?? []}
        initialYear={year}
        totalPlanned={result.totalPlanned ?? 0}
        totalActual={result.totalActual ?? 0}
      />
    </div>
  )
}
