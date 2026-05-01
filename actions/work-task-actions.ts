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
    revalidatePath('/work-tasks')
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
    revalidatePath('/work-tasks')
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
    revalidatePath('/work-tasks')
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

    revalidatePath('/work-tasks')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
