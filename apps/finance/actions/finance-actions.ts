'use server'

import { auth } from '@clerk/nextjs/server'
import { assertRole, requireRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type {
  FinanceBudgetCategory,
  FinanceBudgetCategoryWithChildren,
  FinanceBudget,
  FinanceBudgetWithCategory,
  FinanceExpenditure,
  FinanceExpenditureWithCategory,
  FinanceBudgetAdjustment,
  FinanceDashboardData,
  FinanceCategoryStats,
  FinanceFundingBreakdown,
  CreateExpenditureInput,
  UpsertBudgetInput,
} from '@co-at/types'

// ── Categories ────────────────────────────────────────────

export async function getCategories(): Promise<FinanceBudgetCategoryWithChildren[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('finance_budget_categories')
    .select('*')
    .order('order_no')
  if (error) { console.error('[getCategories]', error); return [] }
  const rows = (data ?? []) as FinanceBudgetCategory[]
  const roots = rows.filter(r => !r.parent_id)
  return roots.map(root => ({
    ...root,
    children: rows.filter(r => r.parent_id === root.id),
  }))
}

export async function createCategory(input: {
  name: string
  code?: string
  parent_id?: string
  order_no?: number
}): Promise<FinanceBudgetCategory | null> {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('finance_budget_categories')
    .insert({ name: input.name, code: input.code ?? null, parent_id: input.parent_id ?? null, order_no: input.order_no ?? 0 })
    .select()
    .single()
  if (error) { console.error('[createCategory]', error); return null }
  return data as FinanceBudgetCategory
}

export async function updateCategory(id: string, input: { name?: string; order_no?: number }): Promise<boolean> {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('finance_budget_categories')
    .update(input)
    .eq('id', id)
  if (error) { console.error('[updateCategory]', error); return false }
  return true
}

export async function deleteCategory(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  // Block if children exist
  const { count } = await supabase
    .from('finance_budget_categories')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', id)
  if ((count ?? 0) > 0) return { ok: false, error: '하위 카테고리가 있어 삭제할 수 없습니다.' }
  const { error } = await supabase.from('finance_budget_categories').delete().eq('id', id)
  if (error) { console.error('[deleteCategory]', error); return { ok: false, error: error.message } }
  return { ok: true }
}

// ── Budgets ───────────────────────────────────────────────

export async function getBudgets(year: number): Promise<FinanceBudgetWithCategory[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('finance_budgets')
    .select('*, finance_budget_categories(*)')
    .eq('year', year)
  if (error) { console.error('[getBudgets]', error); return [] }
  return (data ?? []) as FinanceBudgetWithCategory[]
}

export async function upsertBudget(input: UpsertBudgetInput): Promise<FinanceBudget | null> {
  await assertRole(ROLES.ADMIN)
  const { userId } = await auth()
  if (!userId) return null
  const supabase = createSupabaseAdmin()

  // Load existing to record adjustment
  const { data: existing } = await supabase
    .from('finance_budgets')
    .select('*')
    .eq('year', input.year)
    .eq('category_id', input.category_id)
    .maybeSingle()

  const { data, error } = await supabase
    .from('finance_budgets')
    .upsert(
      { year: input.year, category_id: input.category_id, amount: input.amount, note: input.note ?? null },
      { onConflict: 'year,category_id' }
    )
    .select()
    .single()
  if (error) { console.error('[upsertBudget]', error); return null }

  // Record adjustment if amount changed
  if (existing && existing.amount !== input.amount) {
    await supabase.from('finance_budget_adjustments').insert({
      budget_id:     data.id,
      before_amount: existing.amount,
      after_amount:  input.amount,
      adjusted_by:   userId,
    })
  }

  return data as FinanceBudget
}

export async function copyBudgetYear(fromYear: number, toYear: number): Promise<boolean> {
  await assertRole(ROLES.ADMIN)
  const supabase = createSupabaseAdmin()
  const { data: source, error: srcErr } = await supabase
    .from('finance_budgets')
    .select('category_id, amount, note')
    .eq('year', fromYear)
  if (srcErr || !source?.length) return false

  const inserts = source.map(r => ({ year: toYear, category_id: r.category_id, amount: r.amount, note: r.note }))
  const { error } = await supabase
    .from('finance_budgets')
    .upsert(inserts, { onConflict: 'year,category_id' })
  if (error) { console.error('[copyBudgetYear]', error); return false }
  return true
}

export async function getBudgetAdjustments(budgetId: string): Promise<FinanceBudgetAdjustment[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('finance_budget_adjustments')
    .select('*')
    .eq('budget_id', budgetId)
    .order('adjusted_at', { ascending: false })
  if (error) { console.error('[getBudgetAdjustments]', error); return [] }
  return (data ?? []) as FinanceBudgetAdjustment[]
}

// ── Expenditures ──────────────────────────────────────────

export async function getExpenditures(filters?: {
  year?: number
  month?: number
  category_id?: string
  is_manual?: boolean
}): Promise<FinanceExpenditureWithCategory[]> {
  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('finance_expenditures')
    .select('*, finance_budget_categories(*)')
    .order('spend_date', { ascending: false })

  if (filters?.year) {
    const start = `${filters.year}-01-01`
    const end   = `${filters.year}-12-31`
    query = query.gte('spend_date', start).lte('spend_date', end)
  }
  if (filters?.month && filters?.year) {
    const mm = String(filters.month).padStart(2, '0')
    query = query.gte('spend_date', `${filters.year}-${mm}-01`)
                 .lte('spend_date', `${filters.year}-${mm}-31`)
  }
  if (filters?.category_id) query = query.eq('category_id', filters.category_id)
  if (filters?.is_manual !== undefined) query = query.eq('is_manual', filters.is_manual)

  const { data, error } = await query.limit(500)
  if (error) { console.error('[getExpenditures]', error); return [] }
  return (data ?? []) as FinanceExpenditureWithCategory[]
}

export async function createExpenditure(input: CreateExpenditureInput): Promise<FinanceExpenditure | null> {
  await assertRole(ROLES.MANAGER)
  const { userId } = await auth()
  if (!userId) return null
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('finance_expenditures')
    .insert({
      category_id:  input.category_id,
      spend_date:   input.spend_date,
      amount:       input.amount,
      description:  input.description,
      note:         input.note ?? null,
      receipt_url:  input.receipt_url ?? null,
      is_manual:    true,
      created_by:   userId,
    })
    .select()
    .single()
  if (error) { console.error('[createExpenditure]', error); return null }
  return data as FinanceExpenditure
}

export async function updateExpenditureCategory(id: string, category_id: string | null): Promise<boolean> {
  await assertRole(ROLES.MANAGER)
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('finance_expenditures')
    .update({ category_id })
    .eq('id', id)
  if (error) { console.error('[updateExpenditureCategory]', error); return false }
  return true
}

// Called from approval app when expenditure document is fully approved
export async function createExpenditureFromApproval(input: {
  spend_date: string
  amount: number
  description: string
  source_approval_id: string
  created_by: string
}): Promise<boolean> {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('finance_expenditures').insert({
    ...input,
    category_id: null,
    is_manual:   false,
  })
  if (error) { console.error('[createExpenditureFromApproval]', error); return false }
  return true
}

// ── Dashboard data ────────────────────────────────────────

export async function getDashboardData(year: number): Promise<FinanceDashboardData> {
  const supabase = createSupabaseAdmin()

  const [categoriesRes, budgetsRes, expendituresRes] = await Promise.all([
    supabase.from('finance_budget_categories').select('*').order('order_no'),
    supabase.from('finance_budgets').select('*').eq('year', year),
    supabase.from('finance_expenditures').select('category_id, amount, spend_date')
      .gte('spend_date', `${year}-01-01`)
      .lte('spend_date', `${year}-12-31`),
  ])

  const categories = (categoriesRes.data ?? []) as FinanceBudgetCategory[]
  const budgets    = (budgetsRes.data ?? []) as FinanceBudget[]
  const spends     = (expendituresRes.data ?? []) as { category_id: string | null; amount: number; spend_date: string }[]

  // Category stats
  const budgetMap = new Map(budgets.map(b => [b.category_id, b.amount]))
  const spendMap  = new Map<string, number>()
  let totalSpent  = 0
  for (const s of spends) {
    totalSpent += s.amount
    if (s.category_id) {
      spendMap.set(s.category_id, (spendMap.get(s.category_id) ?? 0) + s.amount)
    }
  }

  const roots = categories.filter(c => !c.parent_id)
  const children = categories.filter(c => !!c.parent_id)

  const categoryStats: FinanceCategoryStats[] = roots.map(root => {
    const rootChildren = children.filter(c => c.parent_id === root.id)
    const childStats = rootChildren.map(child => {
      const budget  = budgetMap.get(child.id) ?? 0
      const spent   = spendMap.get(child.id) ?? 0
      return { category: child, budget, spent, remaining: budget - spent, rate: budget ? Math.round((spent / budget) * 100) : 0 }
    })
    const budget  = (budgetMap.get(root.id) ?? 0) + childStats.reduce((s, c) => s + c.budget, 0)
    const spent   = (spendMap.get(root.id) ?? 0) + childStats.reduce((s, c) => s + c.spent, 0)
    return { category: root, budget, spent, remaining: budget - spent, rate: budget ? Math.round((spent / budget) * 100) : 0, children: childStats }
  })

  const totalBudget = categoryStats.reduce((s, c) => s + c.budget, 0)

  // Funding breakdown (국비/도비) using per-category ratios
  let nationalBudget = 0, nationalSpent = 0
  let provincialBudget = 0, provincialSpent = 0
  for (const stat of categoryStats) {
    const items = stat.children?.length ? stat.children : [stat]
    for (const item of items) {
      const nRatio = item.category.national_ratio / 100
      nationalBudget   += Math.round(item.budget * nRatio)
      nationalSpent    += Math.round(item.spent  * nRatio)
      provincialBudget += item.budget - Math.round(item.budget * nRatio)
      provincialSpent  += item.spent  - Math.round(item.spent  * nRatio)
    }
  }
  const fundingBreakdown: FinanceFundingBreakdown = {
    nationalBudget, nationalSpent, provincialBudget, provincialSpent,
  }

  // Monthly spend
  const monthlyMap = new Map<number, number>()
  for (const s of spends) {
    const month = parseInt(s.spend_date.slice(5, 7))
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + s.amount)
  }
  const monthlySpend = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    amount: monthlyMap.get(i + 1) ?? 0,
  }))

  return {
    year,
    totalBudget,
    totalSpent,
    remaining: totalBudget - totalSpent,
    executionRate: totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0,
    categoryStats,
    monthlySpend,
    fundingBreakdown,
  }
}
