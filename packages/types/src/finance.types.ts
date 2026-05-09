// ── Finance types ─────────────────────────────────────────

export interface FinanceBudgetCategory {
  id: string
  parent_id: string | null
  name: string
  code: string | null
  order_no: number
  created_at: string
}

export interface FinanceBudgetCategoryWithChildren extends FinanceBudgetCategory {
  children: FinanceBudgetCategory[]
}

export interface FinanceBudget {
  id: string
  year: number
  category_id: string
  amount: number
  note: string | null
  created_at: string
  updated_at: string
}

export interface FinanceBudgetWithCategory extends FinanceBudget {
  finance_budget_categories: FinanceBudgetCategory
}

export interface FinanceExpenditure {
  id: string
  category_id: string | null
  spend_date: string
  amount: number
  description: string
  source_approval_id: string | null
  is_manual: boolean
  receipt_url: string | null
  note: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface FinanceExpenditureWithCategory extends FinanceExpenditure {
  finance_budget_categories: FinanceBudgetCategory | null
}

export interface FinanceBudgetAdjustment {
  id: string
  budget_id: string
  before_amount: number
  after_amount: number
  reason: string | null
  adjusted_by: string
  adjusted_at: string
}

// ── Aggregated types for dashboard ───────────────────────

export interface FinanceCategoryStats {
  category: FinanceBudgetCategory
  budget: number
  spent: number
  remaining: number
  rate: number  // percentage 0-100
  children?: FinanceCategoryStats[]
}

export interface FinanceMonthlySpend {
  month: number  // 1-12
  amount: number
}

export interface FinanceDashboardData {
  year: number
  totalBudget: number
  totalSpent: number
  remaining: number
  executionRate: number
  categoryStats: FinanceCategoryStats[]
  monthlySpend: FinanceMonthlySpend[]
}

// ── Input types ───────────────────────────────────────────

export interface CreateExpenditureInput {
  category_id: string | null
  spend_date: string
  amount: number
  description: string
  note?: string
  receipt_url?: string
}

export interface UpsertBudgetInput {
  year: number
  category_id: string
  amount: number
  note?: string
}
