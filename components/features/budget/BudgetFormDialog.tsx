// components/features/budget/BudgetFormDialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { upsertBudget } from "@/actions/budget-actions"
import { BUDGET_CATEGORIES, type Budget } from "@/lib/budget-constants"

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
