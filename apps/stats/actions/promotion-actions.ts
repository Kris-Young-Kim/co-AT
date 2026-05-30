"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export type PromotionMonthly = {
  id: string
  year: number
  month: number
  homepage_posts: number | null
  facebook_posts: number | null
  kakao_posts: number | null
  instagram_posts: number | null
  blog_posts: number | null
  hp_notice: number | null
  hp_gallery: number | null
  hp_gov_support: number | null
  hp_online_inquiry: number | null
  hp_visitor_total: number | null
  hp_daily_avg: number | null
  hp_monthly_avg: number | null
  hp_visitor_ratio: number | null
  ig_story: number | null
  ig_post: number | null
  ig_online_inquiry: number | null
  ig_follower_ratio: number | null
  ig_non_follower_ratio: number | null
  ig_total_views: number | null
  ig_top_post: string | null
}

export type PromotionActivity = {
  id: string
  year: number
  activity_date: string | null
  content: string
  total_count: number | null
  promo_material_type: string | null
  promo_material_count: number | null
  media_type: string | null
  media_count: number | null
  event_type: string | null
  event_count: number | null
  event_attendees: number | null
  other_type: string | null
  other_count: number | null
  other_times: number | null
  notes: string | null
  sort_order: number
}

export async function getPromotionMonthly(year: number): Promise<PromotionMonthly[]> {
  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('stats_promotion_monthly')
    .select('*')
    .eq('year', year)
    .order('month')
  return (data ?? []) as PromotionMonthly[]
}

export async function upsertPromotionMonthly(
  year: number,
  month: number,
  data: Partial<Omit<PromotionMonthly, 'id' | 'year' | 'month'>>
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }
  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from('stats_promotion_monthly')
    .upsert({ year, month, ...data }, { onConflict: 'year,month' })
  if (error) return { success: false, error: error.message }
  revalidatePath('/promotion')
  return { success: true }
}

export async function getPromotionActivities(year: number): Promise<PromotionActivity[]> {
  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('stats_promotion_activities')
    .select('*')
    .eq('year', year)
    .order('sort_order')
    .order('activity_date')
  return (data ?? []) as PromotionActivity[]
}

export async function createPromotionActivity(
  data: Omit<PromotionActivity, 'id'>
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }
  const supabase = createAdminClient()
  const { error } = await (supabase as any).from('stats_promotion_activities').insert(data)
  if (error) return { success: false, error: error.message }
  revalidatePath('/promotion')
  return { success: true }
}

export async function updatePromotionActivity(
  id: string,
  data: Partial<Omit<PromotionActivity, 'id'>>
): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }
  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from('stats_promotion_activities')
    .update(data)
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/promotion')
  return { success: true }
}

export async function deletePromotionActivity(id: string): Promise<{ success: boolean; error?: string }> {
  const ok = await hasAdminOrStaffPermission()
  if (!ok) return { success: false, error: '권한이 없습니다' }
  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from('stats_promotion_activities')
    .delete()
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/promotion')
  return { success: true }
}
