// lib/budget-constants.ts
// Shared budget types and constants (no "use server" — safe to import anywhere)

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
  variance: number
  utilization_rate: number
}

export interface CreateBudgetInput {
  year: number
  month?: number | null
  category: string
  planned_amount: number
  notes?: string
}

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
