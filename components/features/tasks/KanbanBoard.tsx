// components/features/tasks/KanbanBoard.tsx
"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { KanbanColumn } from "./KanbanColumn"
import { TaskCard } from "./TaskCard"
import { TaskFormDialog } from "./TaskFormDialog"
import { updateTaskStatusBatch, deleteWorkTask, type WorkTask, type TaskStatus } from "@/actions/work-task-actions"

interface KanbanBoardProps {
  initialTasks: WorkTask[]
}

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

export function KanbanBoard({ initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<WorkTask[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<WorkTask | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editTask, setEditTask] = useState<WorkTask | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => tasks.filter(t => t.status === status),
    [tasks]
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find(t => t.id === activeId)
    if (!activeTask) return

    // overId is either a column status or a task id
    const overStatus = STATUSES.includes(overId as TaskStatus)
      ? (overId as TaskStatus)
      : tasks.find(t => t.id === overId)?.status

    if (overStatus && overStatus !== activeTask.status) {
      setTasks(prev =>
        prev.map(t => t.id === activeId ? { ...t, status: overStatus } : t)
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    setTasks(prev => {
      const activeIdx = prev.findIndex(t => t.id === activeId)
      const overIdx = prev.findIndex(t => t.id === overId)

      if (activeIdx === -1) return prev

      let newTasks = [...prev]
      if (overIdx !== -1 && activeIdx !== overIdx) {
        newTasks = arrayMove(newTasks, activeIdx, overIdx)
      }

      // Recalculate sort_order within each status group
      const byStatus: Record<string, WorkTask[]> = {}
      newTasks.forEach(t => {
        if (!byStatus[t.status]) byStatus[t.status] = []
        byStatus[t.status].push(t)
      })

      const updates: { id: string; status: TaskStatus; sort_order: number }[] = []
      newTasks = newTasks.map(t => {
        const idx = byStatus[t.status].findIndex(x => x.id === t.id)
        updates.push({ id: t.id, status: t.status, sort_order: idx })
        return { ...t, sort_order: idx }
      })

      // Persist async
      updateTaskStatusBatch(updates).catch(console.error)
      return newTasks
    })
  }

  const handleAdd = (status: TaskStatus) => {
    setEditTask(null)
    setDefaultStatus(status)
    setFormOpen(true)
  }

  const handleEdit = (task: WorkTask) => {
    setEditTask(task)
    setFormOpen(true)
  }

  const handleDelete = async (task: WorkTask) => {
    if (!confirm(`"${task.title}"을 삭제하시겠습니까?`)) return
    const result = await deleteWorkTask(task.id)
    if (result.success) {
      setTasks(prev => prev.filter(t => t.id !== task.id))
    } else {
      alert(result.error || '삭제에 실패했습니다')
    }
  }

  const handleFormSuccess = (task: WorkTask) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id)
      if (exists) return prev.map(t => t.id === task.id ? task : t)
      return [task, ...prev]
    })
    setEditTask(null)
    setFormOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">업무 관리</h1>
        <Button onClick={() => handleAdd('todo')}>
          <Plus className="h-4 w-4 mr-1" />
          업무 추가
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUSES.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={getTasksByStatus(status)}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <TaskCard
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      <TaskFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTask(null) }}
        task={editTask}
        defaultStatus={defaultStatus}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
