// components/features/supplies/SuppliesManagementContent.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, ArrowDownCircle, AlertTriangle, Search } from "lucide-react"
import { deleteSupply, type Supply } from "@/actions/supplies-actions"
import { SupplyFormDialog } from "./SupplyFormDialog"
import { SupplyTransactionModal } from "./SupplyTransactionModal"

interface SuppliesManagementContentProps {
  initialSupplies: Supply[]
}

export function SuppliesManagementContent({ initialSupplies }: SuppliesManagementContentProps) {
  const [supplies, setSupplies] = useState(initialSupplies)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Supply | null>(null)
  const [txTarget, setTxTarget] = useState<Supply | null>(null)

  const filtered = supplies.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (supply: Supply) => {
    if (!confirm(`"${supply.name}"을 삭제하시겠습니까?`)) return
    const result = await deleteSupply(supply.id)
    if (result.success) {
      setSupplies(prev => prev.filter(s => s.id !== supply.id))
    } else {
      alert(result.error || '삭제에 실패했습니다')
    }
  }

  const handleFormSuccess = (supply: Supply) => {
    setSupplies(prev => {
      const exists = prev.find(s => s.id === supply.id)
      if (exists) return prev.map(s => s.id === supply.id ? supply : s)
      return [supply, ...prev]
    })
    setEditTarget(null)
    setFormOpen(false)
  }

  const handleStockChange = (supplyId: string, newStock: number) => {
    setSupplies(prev => prev.map(s =>
      s.id === supplyId ? { ...s, current_stock: newStock } : s
    ))
  }

  const lowStockCount = supplies.filter(s => s.current_stock <= s.minimum_stock && s.minimum_stock > 0).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">소모품 관리</h1>
          {lowStockCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              재고 부족 {lowStockCount}건
            </Badge>
          )}
        </div>
        <Button onClick={() => { setEditTarget(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          소모품 등록
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="품명 또는 분류 검색" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {search ? '검색 결과가 없습니다.' : '등록된 소모품이 없습니다.'}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(supply => {
          const isLow = supply.minimum_stock > 0 && supply.current_stock <= supply.minimum_stock
          return (
            <Card key={supply.id} className={isLow ? 'border-destructive' : ''}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{supply.name}</p>
                    {supply.category && <p className="text-xs text-muted-foreground">{supply.category}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setTxTarget(supply)} title="입출고">
                      <ArrowDownCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditTarget(supply); setFormOpen(true) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(supply)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {supply.current_stock}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{supply.unit}</span>
                  </div>
                  {isLow && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />재고 부족
                    </Badge>
                  )}
                </div>
                {supply.location && <p className="text-xs text-muted-foreground">위치: {supply.location}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <SupplyFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        supply={editTarget}
        onSuccess={handleFormSuccess}
      />
      <SupplyTransactionModal
        supply={txTarget}
        onClose={() => setTxTarget(null)}
        onStockChange={handleStockChange}
      />
    </div>
  )
}
