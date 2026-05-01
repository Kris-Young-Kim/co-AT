// actions/voc-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export type VocType = 'complaint' | 'suggestion' | 'praise'
export type VocStatus = 'open' | 'resolved'

export interface ClientVoc {
  id: string
  client_id: string
  type: VocType
  content: string
  status: VocStatus
  response: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateVocInput {
  client_id: string
  type: VocType
  content: string
}

export async function getClientVocs(clientId: string): Promise<{
  success: boolean
  vocs?: ClientVoc[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('client_voc')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, vocs: data as ClientVoc[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function createClientVoc(input: CreateVocInput): Promise<{
  success: boolean
  voc?: ClientVoc
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')
    if (!input.content.trim()) throw new Error('내용을 입력해주세요')

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('client_voc')
      .insert({ ...input, created_by: userId })
      .select()
      .single()

    if (error) throw error
    revalidatePath(`/clients/${input.client_id}`)
    return { success: true, voc: data as ClientVoc }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function resolveClientVoc(
  vocId: string,
  clientId: string,
  response: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from('client_voc')
      .update({ status: 'resolved', response, updated_at: new Date().toISOString() })
      .eq('id', vocId)

    if (error) throw error
    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteClientVoc(
  vocId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = createAdminClient()
    const { error } = await (supabase as any).from('client_voc').delete().eq('id', vocId)

    if (error) throw error
    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
