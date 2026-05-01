// app/(admin)/work-tasks/page.tsx
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { getWorkTasks } from "@/actions/work-task-actions"
import { KanbanBoard } from "@/components/features/tasks/KanbanBoard"

export const dynamic = "force-dynamic"
export const metadata = { title: "업무 관리" }

export default async function WorkTasksPage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) redirect("/")

  const result = await getWorkTasks()
  const tasks = result.success ? (result.tasks ?? []) : []

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <KanbanBoard initialTasks={tasks} />
    </div>
  )
}
