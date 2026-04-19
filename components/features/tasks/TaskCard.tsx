// components/features/tasks/TaskCard.tsx
"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GripVertical, Edit, Trash2, Calendar, User } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import type { WorkTask } from "@/actions/work-task-actions"

const PRIORITY_CONFIG = {
  high: { label: '높음', color: 'destructive' as const, dot: '🔴' },
  medium: { label: '보통', color: 'default' as const, dot: '🟡' },
  low: { label: '낮음', color: 'outline' as const, dot: '🟢' },
}

interface TaskCardProps {
  task: WorkTask
  onEdit: (task: WorkTask) => void
  onDelete: (task: WorkTask) => void
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const priority = PRIORITY_CONFIG[task.priority]
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="cursor-default shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-snug ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onEdit(task)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onDelete(task)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-1">
            <Badge variant={priority.color} className="text-xs px-1.5 py-0">
              {priority.dot} {priority.label}
            </Badge>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {task.assignee_id && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {task.assignee_id}
                </span>
              )}
              {task.due_date && (
                <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.due_date), 'MM/dd', { locale: ko })}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
