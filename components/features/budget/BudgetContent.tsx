// components/features/budget/BudgetContent.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { deleteBudget, getBudgetsWithActual } from "@/actions/budget-actions"
import { BUDGET_CATEGORIES, type BudgetWithActual } from "@/lib/budget-constants"
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
