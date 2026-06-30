"use client"

import { useState, useMemo } from "react"
import {
  createPartnerCenter,
  updatePartnerCenter,
  deletePartnerCenter,
  type PartnerCenter,
  type PartnerCenterInput,
} from "@/actions/partner-center-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react"

const EMPTY_INPUT: PartnerCenterInput = {
  name: "",
  region: "",
  district: "",
  phone: "",
  fax: "",
  email: "",
  address: "",
  website: "",
  memo: "",
}

interface Props {
  initialCenters: PartnerCenter[]
}

export function PartnerCenterManager({ initialCenters }: Props) {
  const [centers, setCenters] = useState<PartnerCenter[]>(initialCenters)
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PartnerCenter | null>(null)
  const [form, setForm] = useState<PartnerCenterInput>(EMPTY_INPUT)
  const [deleteTarget, setDeleteTarget] = useState<PartnerCenter | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const regions = useMemo(
    () => Array.from(new Set(centers.map((c) => c.region))).sort(),
    [centers]
  )

  const filtered = useMemo(
    () => (regionFilter === "all" ? centers : centers.filter((c) => c.region === regionFilter)),
    [centers, regionFilter]
  )

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_INPUT)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(center: PartnerCenter) {
    setEditTarget(center)
    setForm({
      name: center.name,
      region: center.region,
      district: center.district,
      phone: center.phone,
      fax: center.fax ?? "",
      email: center.email ?? "",
      address: center.address ?? "",
      website: center.website ?? "",
      memo: center.memo ?? "",
    })
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.region || !form.district || !form.phone) {
      setError("기관명, 광역시도, 시군구, 전화번호는 필수입니다")
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editTarget) {
        const res = await updatePartnerCenter(editTarget.id, form)
        if (!res.success) { setError(res.error ?? "수정 실패"); return }
        setCenters((prev) =>
          prev.map((c) =>
            c.id === editTarget.id ? { ...c, ...form, updated_at: new Date().toISOString() } : c
          )
        )
      } else {
        const res = await createPartnerCenter(form)
        if (!res.success || !res.id) { setError(res.error ?? "추가 실패"); return }
        setCenters((prev) => [
          ...prev,
          { ...form, id: res.id!, fax: form.fax ?? null, email: form.email ?? null,
            address: form.address ?? null, website: form.website ?? null,
            memo: form.memo ?? null, created_at: new Date().toISOString(),
            updated_at: new Date().toISOString() },
        ])
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const res = await deletePartnerCenter(deleteTarget.id)
    if (res.success) {
      setCenters((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setDeleteTarget(null)
    } else {
      setError(res.error ?? "삭제에 실패했습니다")
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="지역 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          기관 추가
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>기관명</TableHead>
              <TableHead>광역시도</TableHead>
              <TableHead>전화</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>홈페이지</TableHead>
              <TableHead className="w-20 text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  등록된 협력기관이 없습니다
                </TableCell>
              </TableRow>
            )}
            {filtered.map((center) => (
              <TableRow
                key={center.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => openEdit(center)}
              >
                <TableCell className="font-medium">{center.name}</TableCell>
                <TableCell>{center.region}</TableCell>
                <TableCell>{center.phone}</TableCell>
                <TableCell>{center.email ?? "-"}</TableCell>
                <TableCell>
                  {center.website ? (
                    <a
                      href={center.website.startsWith("http") ? center.website : `https://${center.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      {center.website}
                    </a>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(center)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(center)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 추가/수정 모달 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "협력기관 수정" : "협력기관 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="pc-name">기관명 *</Label>
                <Input id="pc-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pc-region">광역시도 *</Label>
                <Input id="pc-region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pc-district">시군구 *</Label>
                <Input id="pc-district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pc-phone">전화번호 *</Label>
                <Input id="pc-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pc-fax">팩스</Label>
                <Input id="pc-fax" value={form.fax ?? ""} onChange={(e) => setForm({ ...form, fax: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="pc-email">이메일</Label>
                <Input id="pc-email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="pc-address">주소</Label>
                <Input id="pc-address" value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="pc-website">홈페이지</Label>
                <Input id="pc-website" value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="www.example.or.kr" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="pc-memo">협력 메모</Label>
                <Textarea
                  id="pc-memo"
                  value={form.memo ?? ""}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  rows={3}
                  placeholder="협력 내용, 특이사항 등"
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>취소</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : editTarget ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>협력기관 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong>을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
