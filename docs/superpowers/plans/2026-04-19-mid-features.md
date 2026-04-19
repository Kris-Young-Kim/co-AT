# 중기 기능 (칸반·행사역할·예산) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 3개 중기 기능 — 업무 관리(칸반), 행사 역할 분담, 예산 계획 고도화 — 를 순차적으로 추가한다.

**Architecture:**
- 각 기능은 독립 DB 마이그레이션 → Server Actions → UI 컴포넌트 순으로 구현
- 업무 칸반: @dnd-kit(이미 설치됨) + `work_tasks` 테이블
- 행사 역할: schedules 테이블 연계 + `event_roles` 테이블
- 예산 계획: `budgets` 테이블 신규 + service_logs 집계와 비교 UI

**Tech Stack:** Next.js 16 App Router, Supabase (createAdminClient 패턴), Clerk Auth, @dnd-kit/core + @dnd-kit/sortable, shadcn/ui, TypeScript, Tailwind

**Supabase client 패턴:** `createAdminClient()` (동기, no await) from `@/lib/supabase/admin`
**Auth 패턴:** `const { userId } = await auth()` from `@clerk/nextjs/server`

---

## ══════════════════════════════
## FEATURE 1: 업무 관리 (칸반)
## ══════════════════════════════

### 파일 구조

| 역할 | 경로 |
|------|------|
| DB 마이그레이션 | `migrations/026_create_work_tasks.sql` |
| Server Actions | `actions/work-task-actions.ts` |
| 칸반 보드 | `components/features/tasks/KanbanBoard.tsx` |
| 칸반 컬럼 | `components/features/tasks/KanbanColumn.tsx` |
| 태스크 카드 | `components/features/tasks/TaskCard.tsx` |
| 태스크 폼 | `components/features/tasks/TaskFormDialog.tsx` |
| 페이지 | `app/(admin)/work-tasks/page.tsx` |
| 사이드바 | `components/layout/admin-sidebar.tsx` (수정) |
| 모바일 사이드바 | `components/layout/admin-mobile-sidebar.tsx` (수정) |

---

### Task 1: work_tasks 마이그레이션

**Files:**
- Create: `migrations/026_create_work_tasks.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- migrations/026_create_work_tasks.sql

CREATE TABLE IF NOT EXISTS work_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee_id TEXT,
  due_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_tasks_status ON work_tasks(status);
CREATE INDEX IF NOT EXISTS idx_work_tasks_assignee ON work_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_work_tasks_due_date ON work_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_work_tasks_sort_order ON work_tasks(status, sort_order);

ALTER TABLE work_tasks DISABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Supabase SQL Editor에서 실행**

Supabase 대시보드 → SQL Editor → 위 SQL 실행
확인: `SELECT * FROM work_tasks LIMIT 1;` 오류 없이 실행됨

- [ ] **Step 3: 커밋**

```bash
git -C D:/AILeader1/project/valuewith/co-AT add migrations/026_create_work_tasks.sql
git -C D:/AILeader1/project/valuewith/co-AT commit -m "feat: work_tasks 테이블 마이그레이션"
```

---

### Task 2: Work Task Server Actions

**Files:**
- Create: `actions/work-task-actions.ts`

- [ ] **Step 1: actions/work-task-actions.ts 작성**

```typescript
// actions/work-task-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface WorkTask {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee_id: string | null
  due_date: string | null
  sort_order: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string
  due_date?: string
}

export async function getWorkTasks(): Promise<{
  success: boolean
  tasks?: WorkTask[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('work_tasks')
      .select('*')
      .order('status')
      .order('sort_order')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, tasks: data as WorkTask[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function createWorkTask(input: CreateTaskInput): Promise<{
  success: boolean
  task?: WorkTask
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')
    if (!input.title.trim()) throw new Error('제목을 입력해주세요')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('work_tasks')
      .insert({
        title: input.title.trim(),
        description: input.description ?? null,
        status: input.status ?? 'todo',
        priority: input.priority ?? 'medium',
        assignee_id: input.assignee_id ?? null,
        due_date: input.due_date ?? null,
        sort_order: 0,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error
    revalidatePath('/admin/work-tasks')
    return { success: true, task: data as WorkTask }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function updateWorkTask(
  id: string,
  input: Partial<CreateTaskInput & { status: TaskStatus; sort_order: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from('work_tasks')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    revalidatePath('/admin/work-tasks')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteWorkTask(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { error } = await (supabase as any).from('work_tasks').delete().eq('id', id)

    if (error) throw error
    revalidatePath('/admin/work-tasks')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function updateTaskStatusBatch(
  updates: { id: string; status: TaskStatus; sort_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const now = new Date().toISOString()

    await Promise.all(
      updates.map(({ id, status, sort_order }) =>
        (supabase as any)
          .from('work_tasks')
          .update({ status, sort_order, updated_at: now })
          .eq('id', id)
      )
    )

    revalidatePath('/admin/work-tasks')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd D:/AILeader1/project/valuewith/co-AT && pnpm run build --webpack 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: 커밋**

```bash
git -C D:/AILeader1/project/valuewith/co-AT add actions/work-task-actions.ts
git -C D:/AILeader1/project/valuewith/co-AT commit -m "feat: 업무 관리 server actions (CRUD + 드래그 배치)"
```

---

### Task 3: TaskFormDialog 컴포넌트

**Files:**
- Create: `components/features/tasks/TaskFormDialog.tsx`

- [ ] **Step 1: TaskFormDialog.tsx 작성**

```typescript
// components/features/tasks/TaskFormDialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createWorkTask, updateWorkTask, type WorkTask, type CreateTaskInput, type TaskStatus, type TaskPriority } from "@/actions/work-task-actions"

interface TaskFormDialogProps {
  open: boolean
  onClose: () => void
  task?: WorkTask | null
  defaultStatus?: TaskStatus
  onSuccess: (task: WorkTask) => void
}

export function TaskFormDialog({ open, onClose, task, defaultStatus = 'todo', onSuccess }: TaskFormDialogProps) {
  const [form, setForm] = useState<CreateTaskInput>({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? defaultStatus,
    priority: task?.priority ?? 'medium',
    assignee_id: task?.assignee_id ?? '',
    due_date: task?.due_date ?? '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.title?.trim()) return
    setSubmitting(true)

    if (task) {
      const result = await updateWorkTask(task.id, form)
      if (result.success) {
        onSuccess({ ...task, ...form, updated_at: new Date().toISOString() } as WorkTask)
        onClose()
      } else {
        alert(result.error || '수정에 실패했습니다')
      }
    } else {
      const result = await createWorkTask(form)
      if (result.success && result.task) {
        onSuccess(result.task)
        onClose()
      } else {
        alert(result.error || '생성에 실패했습니다')
      }
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? '업무 수정' : '업무 추가'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>제목 *</Label>
            <Input
              value={form.title ?? ''}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="업무 제목"
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            />
          </div>
          <div>
            <Label>설명</Label>
            <Textarea
              value={form.description ?? ''}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="업무 설명 (선택)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>우선순위</Label>
              <Select
                value={form.priority ?? 'medium'}
                onValueChange={v => setForm(prev => ({ ...prev, priority: v as TaskPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 높음</SelectItem>
                  <SelectItem value="medium">🟡 보통</SelectItem>
                  <SelectItem value="low">🟢 낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>마감일</Label>
              <Input
                type="date"
                value={form.due_date ?? ''}
                onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>담당자 (이름)</Label>
            <Input
              value={form.assignee_id ?? ''}
              onChange={e => setForm(prev => ({ ...prev, assignee_id: e.target.value }))}
              placeholder="담당자 이름"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.title?.trim()}>
            {submitting ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd D:/AILeader1/project/valuewith/co-AT && pnpm run build --webpack 2>&1 | tail -5
```

- [ ] **Step 3: 커밋**

```bash
git -C D:/AILeader1/project/valuewith/co-AT add components/features/tasks/TaskFormDialog.tsx
git -C D:/AILeader1/project/valuewith/co-AT commit -m "feat: TaskFormDialog 컴포넌트"
```

---

### Task 4: KanbanBoard (DnD)

**Files:**
- Create: `components/features/tasks/TaskCard.tsx`
- Create: `components/features/tasks/KanbanColumn.tsx`
- Create: `components/features/tasks/KanbanBoard.tsx`

**@dnd-kit 패키지:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` 모두 이미 설치됨

- [ ] **Step 1: TaskCard.tsx 작성**

```typescript
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
```

- [ ] **Step 2: KanbanColumn.tsx 작성**

```typescript
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
```

- [ ] **Step 3: KanbanBoard.tsx 작성**

```typescript
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
```

- [ ] **Step 4: app/(admin)/work-tasks/page.tsx 작성**

```typescript
// app/(admin)/work-tasks/page.tsx
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { getWorkTasks } from "@/actions/work-task-actions"
import { KanbanBoard } from "@/components/features/tasks/KanbanBoard"

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
```

- [ ] **Step 5: 사이드바에 업무 관리 메뉴 추가**

`components/layout/admin-sidebar.tsx` 파일을 읽어서 `ClipboardList` 아이콘으로 "업무 관리" 항목을 `/admin/work-tasks`에 추가.
`components/layout/admin-mobile-sidebar.tsx`도 동일하게 추가.

```typescript
// 추가할 import
import { ClipboardList } from "lucide-react"

// 메뉴 항목 (일정 관리 근처에 추가)
{ href: '/admin/work-tasks', label: '업무 관리', icon: ClipboardList }
```

- [ ] **Step 6: 빌드 확인**

```bash
cd D:/AILeader1/project/valuewith/co-AT && pnpm run build --webpack 2>&1 | tail -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 7: 커밋**

```bash
git -C D:/AILeader1/project/valuewith/co-AT add components/features/tasks/ "app/(admin)/work-tasks/" components/layout/admin-sidebar.tsx components/layout/admin-mobile-sidebar.tsx
git -C D:/AILeader1/project/valuewith/co-AT commit -m "feat: 업무 관리 칸반 보드 - DnD 드래그앤드롭"
```

---

## ══════════════════════════════
## FEATURE 2: 행사 역할 분담
## ══════════════════════════════

### 파일 구조

| 역할 | 경로 |
|------|------|
| DB 마이그레이션 | `migrations/027_create_event_roles.sql` |
| Server Actions | `actions/event-role-actions.ts` |
| 역할 분담 모달 | `components/features/schedule/EventRoleModal.tsx` |
| 일정 관리 연결 | `components/features/schedule/ScheduleManagementContent.tsx` (수정) |

---

### Task 5: event_roles 마이그레이션

**Files:**
- Create: `migrations/027_create_event_roles.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- migrations/027_create_event_roles.sql

CREATE TABLE IF NOT EXISTS event_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  assignee_name TEXT NOT NULL,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_roles_schedule_id ON event_roles(schedule_id);

ALTER TABLE event_roles DISABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Supabase SQL Editor에서 실행**

- [ ] **Step 3: 커밋**

```bash
git -C D:/AILeader1/project/valuewith/co-AT add migrations/027_create_event_roles.sql
git -C D:/AILeader1/project/valuewith/co-AT commit -m "feat: event_roles 테이블 마이그레이션"
```

---

### Task 6: Event Role Server Actions

**Files:**
- Create: `actions/event-role-actions.ts`

- [ ] **Step 1: actions/event-role-actions.ts 작성**

```typescript
// actions/event-role-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export interface EventRole {
  id: string
  schedule_id: string
  role_name: string
  assignee_name: string
  notes: string | null
  sort_order: number
  created_by: string
  created_at: string
}

export interface CreateEventRoleInput {
  schedule_id: string
  role_name: string
  assignee_name: string
  notes?: string
}

// 행사에서 자주 쓰는 역할 프리셋
export const ROLE_PRESETS = [
  '진행자', '등록', '안내', '촬영/기록', '차량 지원',
  '물품 준비', '강사', '보조강사', '행정 지원', '기타'
]

export async function getEventRoles(scheduleId: string): Promise<{
  success: boolean
  roles?: EventRole[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('event_roles')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('sort_order')
      .order('created_at')

    if (error) throw error
    return { success: true, roles: data as EventRole[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function createEventRole(input: CreateEventRoleInput): Promise<{
  success: boolean
  role?: EventRole
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('event_roles')
      .insert({
        schedule_id: input.schedule_id,
        role_name: input.role_name,
        assignee_name: input.assignee_name,
        notes: input.notes ?? null,
        sort_order: 0,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error
    revalidatePath('/admin/schedule')
    return { success: true, role: data as EventRole }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteEventRole(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { error } = await (supabase as any).from('event_roles').delete().eq('id', id)

    if (error) throw error
    revalidatePath('/admin/schedule')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd D:/AILeader1/project/valuewith/co-AT && pnpm run build --webpack 2>&1 | tail -5
```

- [ ] **Step 3: 커밋**

```bash
git -C D:/AILeader1/project/valuewith/co-AT add actions/event-role-actions.ts
git -C D:/AILeader1/project/valuewith/co-AT commit -m "feat: 행사 역할 분담 server actions"
```

---

### Task 7: EventRoleModal 컴포넌트 + ScheduleManagementContent 연결

**Files:**
- Create: `components/features/schedule/EventRoleModal.tsx`
- Modify: `components/features/schedule/ScheduleManagementContent.tsx`

- [ ] **Step 1: EventRoleModal.tsx 작성**

```typescript
// components/features/schedule/EventRoleModal.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Users } from "lucide-react"
import {
  getEventRoles,
  createEventRole,
  deleteEventRole,
  ROLE_PRESETS,
  type EventRole,
} from "@/actions/event-role-actions"

interface EventRoleModalProps {
  scheduleId: string | null
  scheduleName: string
  onClose: () => void
}

export function EventRoleModal({ scheduleId, scheduleName, onClose }: EventRoleModalProps) {
  const [roles, setRoles] = useState<EventRole[]>([])
  const [loading, setLoading] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [assigneeName, setAssigneeName] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!scheduleId) return
    setLoading(true)
    getEventRoles(scheduleId).then(result => {
      if (result.success) setRoles(result.roles ?? [])
      setLoading(false)
    })
  }, [scheduleId])

  const effectiveRoleName = roleName === '기타' ? customRole : roleName

  const handleAdd = async () => {
    if (!scheduleId || !effectiveRoleName.trim() || !assigneeName.trim()) return
    setSubmitting(true)
    const result = await createEventRole({
      schedule_id: scheduleId,
      role_name: effectiveRoleName.trim(),
      assignee_name: assigneeName.trim(),
      notes: notes.trim() || undefined,
    })
    if (result.success && result.role) {
      setRoles(prev => [...prev, result.role!])
      setRoleName('')
      setCustomRole('')
      setAssigneeName('')
      setNotes('')
    } else {
      alert(result.error || '추가에 실패했습니다')
    }
    setSubmitting(false)
  }

  const handleDelete = async (role: EventRole) => {
    const result = await deleteEventRole(role.id)
    if (result.success) {
      setRoles(prev => prev.filter(r => r.id !== role.id))
    }
  }

  return (
    <Dialog open={!!scheduleId} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            역할 분담
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{scheduleName}</p>
        </DialogHeader>

        {/* 현재 역할 목록 */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground text-center py-2">로딩 중...</p>}
          {!loading && roles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">아직 역할이 배정되지 않았습니다.</p>
          )}
          {roles.map(role => (
            <div key={role.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs shrink-0">{role.role_name}</Badge>
                <span className="text-sm font-medium">{role.assignee_name}</span>
                {role.notes && <span className="text-xs text-muted-foreground">({role.notes})</span>}
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => handleDelete(role)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {/* 역할 추가 폼 */}
        <div className="border-t pt-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">역할 추가</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">역할</Label>
              <Select value={roleName} onValueChange={setRoleName}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_PRESETS.map(preset => (
                    <SelectItem key={preset} value={preset}>{preset}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roleName === '기타' && (
                <Input
                  className="mt-1 h-8 text-sm"
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="역할명 직접 입력"
                />
              )}
            </div>
            <div>
              <Label className="text-xs">담당자</Label>
              <Input
                className="h-8 text-sm"
                value={assigneeName}
                onChange={e => setAssigneeName(e.target.value)}
                placeholder="담당자 이름"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">비고 (선택)</Label>
            <Input
              className="h-8 text-sm"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="추가 정보"
            />
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={handleAdd}
            disabled={submitting || !effectiveRoleName.trim() || !assigneeName.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            {submitting ? '추가 중...' : '역할 추가'}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: ScheduleManagementContent.tsx 수정**

`components/features/schedule/ScheduleManagementContent.tsx` 파일을 읽어서:

1. import 추가:
```typescript
import { EventRoleModal } from "./EventRoleModal"
import { Users } from "lucide-react"  // 이미 없으면 추가
```

2. state 추가 (meetingModal state 근처에):
```typescript
const [eventRoleModal, setEventRoleModal] = useState<{ scheduleId: string; scheduleName: string } | null>(null)
```

3. 행사(exhibition, education) 타입 일정 카드/행에 역할 분담 버튼 추가:
```tsx
{(schedule.schedule_type === 'exhibition' || schedule.schedule_type === 'education') && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setEventRoleModal({
      scheduleId: schedule.id,
      scheduleName: schedule.notes ?? schedule.schedule_type === 'exhibition' ? '견학' : '교육'
    })}
    title="역할 분담"
  >
    <Users className="h-4 w-4" />
  </Button>
)}
```

4. JSX 하단에 모달 추가:
```tsx
<EventRoleModal
  scheduleId={eventRoleModal?.scheduleId ?? null}
  scheduleName={eventRoleModal?.scheduleName ?? ''}
  onClose={() => setEventRoleModal(null)}
/>
```

- [ ] **Step 3: 빌드 확인**

```bash
cd D:/AILeader1/project/valuewith/co-AT && pnpm run build --webpack 2>&1 | tail -10
```

- [ ] **Step 4: 커밋**

```bash
git -C D:/AILeader1/project/valuewith/co-AT add components/features/schedule/EventRoleModal.tsx components/features/schedule/ScheduleManagementContent.tsx
git -C D:/AILeader1/project/valuewith/co-AT commit -m "feat: 행사 역할 분담 모달 - 견학/교육 일정 역할 배정"
```

---

## ══════════════════════════════
## FEATURE 3: 예산 계획 고도화
## ══════════════════════════════

### 파일 구조

| 역할 | 경로 |
|------|------|
| DB 마이그레이션 | `migrations/028_create_budgets.sql` |
| Server Actions | `actions/budget-actions.ts` |
| 예산 페이지 | `app/(admin)/budget/page.tsx` |
| 예산 콘텐츠 | `components/features/budget/BudgetContent.tsx` |
| 예산 폼 다이얼로그 | `components/features/budget/BudgetFormDialog.tsx` |
| 사이드바 | `components/layout/admin-sidebar.tsx` (수정) |

---

### Task 8: budgets 마이그레이션

**Files:**
- Create: `migrations/028_create_budgets.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- migrations/028_create_budgets.sql

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER CHECK (month BETWEEN 1 AND 12),
  category TEXT NOT NULL,
  planned_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(year, month, category)
);

CREATE INDEX IF NOT EXISTS idx_budgets_year ON budgets(year);
CREATE INDEX IF NOT EXISTS idx_budgets_year_month ON budgets(year, month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);

ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Supabase SQL Editor에서 실행**

- [ ] **Step 3: 커밋**

```bash
git -C D:/AILeader1/project/valuewith/co-AT add migrations/028_create_budgets.sql
git -C D:/AILeader1/project/valuewith/co-AT commit -m "feat: budgets 테이블 마이그레이션"
```

---

### Task 9: Budget Server Actions

**Files:**
- Create: `actions/budget-actions.ts`

- [ ] **Step 1: actions/budget-actions.ts 작성**

```typescript
// actions/budget-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export interface Budget {
  id: string
  year: number
  month: number | null
  category: string
  planned_amount: number
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface BudgetWithActual extends Budget {
  actual_amount: number
  variance: number  // planned - actual (양수 = 절감, 음수 = 초과)
  utilization_rate: number  // actual / planned * 100
}

export interface CreateBudgetInput {
  year: number
  month?: number | null
  category: string
  planned_amount: number
  notes?: string
}

// 서비스 카테고리 레이블 (service_logs.service_type과 매핑)
export const BUDGET_CATEGORIES = [
  { value: 'repair', label: '수리' },
  { value: 'custom_make', label: '맞춤제작' },
  { value: 'rental', label: '대여' },
  { value: 'education', label: '교육' },
  { value: 'maintenance', label: '유지보수' },
  { value: 'inspection', label: '점검' },
  { value: 'cleaning', label: '소독' },
  { value: 'reuse', label: '재활용' },
  { value: 'supplies', label: '소모품' },
  { value: 'other', label: '기타' },
]

export async function getBudgets(year: number): Promise<{
  success: boolean
  budgets?: Budget[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('budgets')
      .select('*')
      .eq('year', year)
      .order('category')

    if (error) throw error
    return { success: true, budgets: data as Budget[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function getBudgetsWithActual(year: number): Promise<{
  success: boolean
  data?: BudgetWithActual[]
  totalPlanned?: number
  totalActual?: number
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()

    // 예산 계획 조회
    const { data: budgets, error: budgetErr } = await (supabase as any)
      .from('budgets')
      .select('*')
      .eq('year', year)
      .order('category')

    if (budgetErr) throw budgetErr

    // 실제 지출 집계 (service_logs.cost_total by service_type)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data: logs, error: logErr } = await (supabase as any)
      .from('service_logs')
      .select('service_type, cost_total')
      .gte('service_date', startDate)
      .lte('service_date', endDate)
      .not('cost_total', 'is', null)

    if (logErr) throw logErr

    // 카테고리별 실제 지출 집계
    const actualByCategory: Record<string, number> = {}
    ;(logs ?? []).forEach((log: any) => {
      const cat = log.service_type ?? 'other'
      actualByCategory[cat] = (actualByCategory[cat] ?? 0) + (log.cost_total ?? 0)
    })

    const result: BudgetWithActual[] = (budgets ?? []).map((b: Budget) => {
      const actual = actualByCategory[b.category] ?? 0
      const planned = b.planned_amount
      return {
        ...b,
        actual_amount: actual,
        variance: planned - actual,
        utilization_rate: planned > 0 ? Math.round((actual / planned) * 100) : 0,
      }
    })

    const totalPlanned = result.reduce((s, b) => s + b.planned_amount, 0)
    const totalActual = result.reduce((s, b) => s + b.actual_amount, 0)

    return { success: true, data: result, totalPlanned, totalActual }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function upsertBudget(input: CreateBudgetInput): Promise<{
  success: boolean
  budget?: Budget
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('budgets')
      .upsert(
        {
          year: input.year,
          month: input.month ?? null,
          category: input.category,
          planned_amount: input.planned_amount,
          notes: input.notes ?? null,
          created_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'year,month,category' }
      )
      .select()
      .single()

    if (error) throw error
    revalidatePath('/admin/budget')
    return { success: true, budget: data as Budget }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteBudget(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { error } = await (supabase as any).from('budgets').delete().eq('id', id)

    if (error) throw error
    revalidatePath('/admin/budget')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd D:/AILeader1/project/valuewith/co-AT && pnpm run build --webpack 2>&1 | tail -5
```

- [ ] **Step 3: 커밋**

```bash
git -C D:/AILeader1/project/valuewith/co-AT add actions/budget-actions.ts
git -C D:/AILeader1/project/valuewith/co-AT commit -m "feat: 예산 계획 server actions (계획 vs 실제 집계)"
```

---

### Task 10: BudgetFormDialog + BudgetContent + 페이지

**Files:**
- Create: `components/features/budget/BudgetFormDialog.tsx`
- Create: `components/features/budget/BudgetContent.tsx`
- Create: `app/(admin)/budget/page.tsx`

- [ ] **Step 1: BudgetFormDialog.tsx 작성**

```typescript
// components/features/budget/BudgetFormDialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { upsertBudget, BUDGET_CATEGORIES, type Budget } from "@/actions/budget-actions"

interface BudgetFormDialogProps {
  open: boolean
  onClose: () => void
  year: number
  budget?: Budget | null
  onSuccess: (budget: Budget) => void
}

export function BudgetFormDialog({ open, onClose, year, budget, onSuccess }: BudgetFormDialogProps) {
  const [category, setCategory] = useState(budget?.category ?? '')
  const [plannedAmount, setPlannedAmount] = useState(String(budget?.planned_amount ?? ''))
  const [notes, setNotes] = useState(budget?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!category || !plannedAmount) return
    setSubmitting(true)
    const result = await upsertBudget({
      year,
      category,
      planned_amount: Number(plannedAmount),
      notes: notes.trim() || undefined,
    })
    if (result.success && result.budget) {
      onSuccess(result.budget)
      onClose()
    } else {
      alert(result.error || '저장에 실패했습니다')
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{budget ? '예산 수정' : `${year}년 예산 등록`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>분류</Label>
            <Select value={category} onValueChange={setCategory} disabled={!!budget}>
              <SelectTrigger>
                <SelectValue placeholder="분류 선택" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>계획 예산 (원)</Label>
            <Input
              type="number"
              value={plannedAmount}
              onChange={e => setPlannedAmount(e.target.value)}
              placeholder="0"
              min={0}
            />
          </div>
          <div>
            <Label>비고</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={submitting || !category || !plannedAmount}>
            {submitting ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: BudgetContent.tsx 작성**

```typescript
// components/features/budget/BudgetContent.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { deleteBudget, getBudgetsWithActual, BUDGET_CATEGORIES, type BudgetWithActual } from "@/actions/budget-actions"
import { BudgetFormDialog } from "./BudgetFormDialog"

interface BudgetContentProps {
  initialData: BudgetWithActual[]
  initialYear: number
  totalPlanned: number
  totalActual: number
}

function formatKRW(amount: number): string {
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억`
  if (amount >= 10_000) return `${Math.round(amount / 10_000).toLocaleString()}만`
  return amount.toLocaleString()
}

export function BudgetContent({ initialData, initialYear, totalPlanned, totalActual }: BudgetContentProps) {
  const [data, setData] = useState<BudgetWithActual[]>(initialData)
  const [year, setYear] = useState(initialYear)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BudgetWithActual | null>(null)
  const [loading, setLoading] = useState(false)

  const overallUtilization = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0
  const overallVariance = totalPlanned - totalActual

  const loadYear = async (newYear: number) => {
    setLoading(true)
    setYear(newYear)
    const result = await getBudgetsWithActual(newYear)
    if (result.success) setData(result.data ?? [])
    setLoading(false)
  }

  const handleDelete = async (budget: BudgetWithActual) => {
    const catLabel = BUDGET_CATEGORIES.find(c => c.value === budget.category)?.label ?? budget.category
    if (!confirm(`"${catLabel}" 예산을 삭제하시겠습니까?`)) return
    const result = await deleteBudget(budget.id)
    if (result.success) {
      setData(prev => prev.filter(b => b.id !== budget.id))
    } else {
      alert(result.error || '삭제에 실패했습니다')
    }
  }

  const handleFormSuccess = (budget: any) => {
    setData(prev => {
      const exists = prev.find(b => b.id === budget.id)
      const updated = { ...budget, actual_amount: 0, variance: budget.planned_amount, utilization_rate: 0 }
      if (exists) return prev.map(b => b.id === budget.id ? { ...b, ...updated } : b)
      return [...prev, updated]
    })
    setEditTarget(null)
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">예산 계획</h1>
          <Select value={String(year)} onValueChange={v => loadYear(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={String(y)}>{y}년</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditTarget(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          예산 등록
        </Button>
      </div>

      {/* 전체 요약 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">계획 예산</p>
            <p className="text-2xl font-bold">{formatKRW(totalPlanned)}<span className="text-sm font-normal text-muted-foreground ml-1">원</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">실제 지출</p>
            <p className="text-2xl font-bold">{formatKRW(totalActual)}<span className="text-sm font-normal text-muted-foreground ml-1">원</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">집행률</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{overallUtilization}%</p>
              {overallVariance > 0
                ? <Badge variant="outline" className="text-green-600"><TrendingDown className="h-3 w-3 mr-1" />{formatKRW(overallVariance)} 절감</Badge>
                : overallVariance < 0
                ? <Badge variant="destructive"><TrendingUp className="h-3 w-3 mr-1" />{formatKRW(-overallVariance)} 초과</Badge>
                : <Badge variant="outline"><Minus className="h-3 w-3" /></Badge>
              }
            </div>
            <Progress value={Math.min(overallUtilization, 100)} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* 카테고리별 예산 */}
      {loading && <p className="text-sm text-muted-foreground text-center py-4">로딩 중...</p>}

      {!loading && data.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {year}년 예산이 등록되지 않았습니다. "예산 등록" 버튼으로 시작하세요.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {data.map(budget => {
          const catLabel = BUDGET_CATEGORIES.find(c => c.value === budget.category)?.label ?? budget.category
          const isOver = budget.utilization_rate > 100
          return (
            <Card key={budget.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{catLabel}</span>
                    <Badge
                      variant={isOver ? 'destructive' : budget.utilization_rate > 80 ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {budget.utilization_rate}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatKRW(budget.actual_amount)} / {formatKRW(budget.planned_amount)}원
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditTarget(budget); setFormOpen(true) }}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDelete(budget)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
                <Progress
                  value={Math.min(budget.utilization_rate, 100)}
                  className={`h-2 ${isOver ? '[&>div]:bg-destructive' : ''}`}
                />
                {budget.variance < 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {formatKRW(-budget.variance)}원 초과
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <BudgetFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        year={year}
        budget={editTarget}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
```

- [ ] **Step 3: app/(admin)/budget/page.tsx 작성**

```typescript
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
```

- [ ] **Step 4: shadcn/ui Progress 컴포넌트 설치 확인**

```bash
ls D:/AILeader1/project/valuewith/co-AT/components/ui/progress.tsx 2>/dev/null || echo "MISSING"
```

없으면 설치:
```bash
cd D:/AILeader1/project/valuewith/co-AT && pnpm dlx shadcn@latest add progress --yes 2>&1 | tail -5
```

- [ ] **Step 5: 사이드바에 예산 계획 메뉴 추가**

`components/layout/admin-sidebar.tsx`를 읽어서 `PiggyBank` 아이콘으로 "예산 계획" 항목을 `/admin/budget`에 추가.
`components/layout/admin-mobile-sidebar.tsx`도 동일하게 추가.

```typescript
import { PiggyBank } from "lucide-react"
// 메뉴 항목:
{ href: '/admin/budget', label: '예산 계획', icon: PiggyBank }
```

- [ ] **Step 6: 빌드 확인**

```bash
cd D:/AILeader1/project/valuewith/co-AT && pnpm run build --webpack 2>&1 | tail -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 7: 커밋**

```bash
git -C D:/AILeader1/project/valuewith/co-AT add components/features/budget/ "app/(admin)/budget/" components/layout/admin-sidebar.tsx components/layout/admin-mobile-sidebar.tsx
git -C D:/AILeader1/project/valuewith/co-AT commit -m "feat: 예산 계획 페이지 - 계획 vs 실제 지출 비교"
```

---

## 검증 방법

### Feature 1 - 업무 칸반
- 사이드바 "업무 관리" 클릭 → 3컬럼 칸반 보드 표시
- "+ 업무 추가" 또는 컬럼 상단 + 버튼 → 폼 입력 → 저장
- 카드를 다른 컬럼으로 드래그 → 상태 자동 변경 + DB 저장

### Feature 2 - 행사 역할 분담
- 일정 관리 → 견학/교육 타입 일정 → 👥 아이콘 클릭 → 역할 분담 모달
- 역할 선택 + 담당자 입력 → "역할 추가" 버튼

### Feature 3 - 예산 계획
- 사이드바 "예산 계획" 클릭 → 집행률 요약 + 카테고리별 Progress 바
- "예산 등록" 버튼 → 분류 선택 + 금액 입력 → 저장
- 연도 셀렉터로 연도 전환 가능
