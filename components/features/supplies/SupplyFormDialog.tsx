// components/features/supplies/SupplyFormDialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createSupply, updateSupply, type Supply, type CreateSupplyInput } from "@/actions/supplies-actions"

interface SupplyFormDialogProps {
  open: boolean
  onClose: () => void
  supply?: Supply | null
  onSuccess: (supply: Supply) => void
}

export function SupplyFormDialog({ open, onClose, supply, onSuccess }: SupplyFormDialogProps) {
  const [form, setForm] = useState<CreateSupplyInput>({
    name: supply?.name ?? '',
    category: supply?.category ?? '',
    unit: supply?.unit ?? '개',
    current_stock: supply?.current_stock ?? 0,
    minimum_stock: supply?.minimum_stock ?? 0,
    location: supply?.location ?? '',
    notes: supply?.notes ?? '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.name?.trim()) return
    setSubmitting(true)

    if (supply) {
      const result = await updateSupply(supply.id, form)
      if (result.success) {
        onSuccess({ ...supply, ...form } as Supply)
        onClose()
      } else {
        alert(result.error || '수정에 실패했습니다')
      }
    } else {
      const result = await createSupply(form)
      if (result.success && result.supply) {
        onSuccess(result.supply)
        onClose()
      } else {
        alert(result.error || '등록에 실패했습니다')
      }
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supply ? '소모품 수정' : '소모품 등록'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>품명 *</Label>
            <Input value={form.name ?? ''} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
          </div>
          <div>
            <Label>분류</Label>
            <Input value={form.category ?? ''} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} />
          </div>
          <div>
            <Label>단위 (개, 박스, 롤 등)</Label>
            <Input value={form.unit ?? '개'} onChange={e => setForm(prev => ({ ...prev, unit: e.target.value }))} />
          </div>
          <div>
            <Label>현재 재고</Label>
            <Input type="number" value={form.current_stock ?? 0} onChange={e => setForm(prev => ({ ...prev, current_stock: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>최소 재고 (알림 기준)</Label>
            <Input type="number" value={form.minimum_stock ?? 0} onChange={e => setForm(prev => ({ ...prev, minimum_stock: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>보관 위치</Label>
            <Input value={form.location ?? ''} onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))} />
          </div>
          <div>
            <Label>비고</Label>
            <Textarea value={form.notes ?? ''} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.name?.trim()}>
            {submitting ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
