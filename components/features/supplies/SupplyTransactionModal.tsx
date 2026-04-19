// components/features/supplies/SupplyTransactionModal.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { addSupplyTransaction, getSupplyTransactions, type Supply, type SupplyTransaction } from "@/actions/supplies-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface SupplyTransactionModalProps {
  supply: Supply | null
  onClose: () => void
  onStockChange: (supplyId: string, newStock: number) => void
}

export function SupplyTransactionModal({ supply, onClose, onStockChange }: SupplyTransactionModalProps) {
  const [txType, setTxType] = useState<'in' | 'out'>('in')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [transactions, setTransactions] = useState<SupplyTransaction[]>([])
  const [loadingTx, setLoadingTx] = useState(false)

  useEffect(() => {
    if (!supply) return
    setLoadingTx(true)
    getSupplyTransactions(supply.id).then(result => {
      if (result.success) setTransactions(result.transactions ?? [])
      setLoadingTx(false)
    })
  }, [supply?.id])

  const handleSubmit = async () => {
    if (!supply || quantity <= 0) return
    setSubmitting(true)
    const result = await addSupplyTransaction(supply.id, txType, quantity, reason)
    if (result.success) {
      const newStock = txType === 'in'
        ? supply.current_stock + quantity
        : supply.current_stock - quantity
      onStockChange(supply.id, newStock)
      onClose()
    } else {
      alert(result.error || '처리에 실패했습니다')
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={!!supply} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>입출고 처리</DialogTitle>
          {supply && <p className="text-sm text-muted-foreground">{supply.name} | 현재 재고: {supply.current_stock} {supply.unit}</p>}
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={txType === 'in' ? 'default' : 'outline'} className="flex-1" onClick={() => setTxType('in')}>
              <ArrowDownCircle className="h-4 w-4 mr-1" />입고
            </Button>
            <Button variant={txType === 'out' ? 'default' : 'outline'} className="flex-1" onClick={() => setTxType('out')}>
              <ArrowUpCircle className="h-4 w-4 mr-1" />출고
            </Button>
          </div>
          <div>
            <Label>수량</Label>
            <Input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} />
          </div>
          <div>
            <Label>사유 (선택)</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="구매, 사용, 폐기 등" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">최근 거래 내역</Label>
            <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
              {loadingTx && <p className="text-xs text-muted-foreground">로딩 중...</p>}
              {!loadingTx && transactions.length === 0 && <p className="text-xs text-muted-foreground">거래 내역이 없습니다.</p>}
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Badge variant={tx.type === 'in' ? 'default' : 'outline'} className="text-xs px-1 py-0">
                      {tx.type === 'in' ? '입고' : '출고'}
                    </Badge>
                    <span>{tx.quantity}개</span>
                    {tx.reason && <span className="text-muted-foreground">({tx.reason})</span>}
                  </div>
                  <span className="text-muted-foreground">{format(new Date(tx.created_at), 'MM/dd', { locale: ko })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={submitting || quantity <= 0}>
            {submitting ? '처리 중...' : '처리'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
