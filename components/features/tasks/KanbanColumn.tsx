// components/features/tasks/KanbanColumn.tsx
"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { TaskCard } from "./TaskCard"
import type { WorkTask, TaskStatus } from "@/actions/work-task-actions"

const COLUMN_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: '할 일', color: 'bg-slate-100' },
  in_progress: { label: '진행 중', color: 'bg-blue-50' },
  done: { label: '완료', color: 'bg-green-50' },
}

interface KanbanColumnProps {
  status: TaskStatus
  tasks: WorkTask[]
  onAdd: (status: TaskStatus) => void
  onEdit: (task: WorkTask) => void
  onDelete: (task: WorkTask) => void
}

export function KanbanColumn({ status, tasks, onAdd, onEdit, onDelete }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const config = COLUMN_CONFIG[status]

  return (
    <div className={`flex flex-col rounded-lg ${config.color} p-3 min-h-[400px] ${isOver ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{config.label}</h3>
          <Badge variant="outline" className="text-xs px-1.5 py-0">{tasks.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onAdd(status)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-col gap-2 flex-1">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
