"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  type ScheduleCategory,
  createScheduleCategory,
  updateScheduleCategory,
  deleteScheduleCategory,
} from "@/actions/schedule-category-actions"
import { cn } from "@/lib/utils"

const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#ec4899", "#6b7280", "#0f766e",
  "#1d4ed8", "#7c3aed", "#be185d", "#92400e",
]

interface CategoryManagerProps {
  categories: ScheduleCategory[]
  onCategoriesChange: (cats: ScheduleCategory[]) => void
}

export function CategoryManager({ categories, onCategoriesChange }: CategoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ScheduleCategory | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(COLOR_PALETTE[6])
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const result = await createScheduleCategory({ name: newName.trim(), color: newColor })
      if (result.success && result.data) {
        onCategoriesChange([...categories, result.data])
        setIsAdding(false)
        setNewName("")
        setNewColor(COLOR_PALETTE[6])
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (cat: ScheduleCategory) => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const result = await updateScheduleCategory(cat.id, { name: editName.trim(), color: editColor })
      if (result.success) {
        onCategoriesChange(
          categories.map(c => c.id === cat.id ? { ...c, name: editName.trim(), color: editColor } : c)
        )
        setEditingId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteScheduleCategory(deleteTarget.id)
    if (result.success) {
      onCategoriesChange(categories.filter(c => c.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            캘린더 카테고리
          </CardTitle>
          {!isAdding && (
            <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              추가
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-1.5">
        {isAdding && (
          <CategoryForm
            name={newName}
            color={newColor}
            onNameChange={setNewName}
            onColorChange={setNewColor}
            onSave={handleAdd}
            onCancel={() => { setIsAdding(false); setNewName(""); setNewColor(COLOR_PALETTE[6]) }}
            saving={saving}
          />
        )}

        {categories.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            카테고리가 없습니다. 추가 버튼을 눌러 시작하세요.
          </p>
        )}

        {categories.map(cat => (
          <div key={cat.id}>
            {editingId === cat.id ? (
              <CategoryForm
                name={editName}
                color={editColor}
                onNameChange={setEditName}
                onColorChange={setEditColor}
                onSave={() => handleEdit(cat)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            ) : (
              <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors group">
                <div
                  className="h-3.5 w-3.5 rounded-full flex-shrink-0 shadow-sm ring-1 ring-black/10"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-medium flex-1 truncate">{cat.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditColor(cat.color) }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(cat)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">"{deleteTarget?.name}"</span> 카테고리를 삭제합니다.
              이 카테고리가 지정된 일정은 카테고리 없음으로 변경됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

interface CategoryFormProps {
  name: string
  color: string
  onNameChange: (v: string) => void
  onColorChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}

function CategoryForm({ name, color, onNameChange, onColorChange, onSave, onCancel, saving }: CategoryFormProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">이름</Label>
        <Input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="예: 방문·상담"
          className="h-8 text-sm"
          autoFocus
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onSave() } }}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">색상</Label>
        <ColorPicker value={color} onChange={onColorChange} />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          취소
        </Button>
        <Button size="sm" onClick={onSave} disabled={!name.trim() || saving}>
          {saving ? "저장 중…" : "저장"}
        </Button>
      </div>
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_PALETTE.map(color => (
        <button
          key={color}
          type="button"
          className={cn(
            "h-6 w-6 rounded-full transition-all duration-150 hover:scale-110 focus:outline-none",
            value === color
              ? "ring-2 ring-offset-2 scale-110"
              : "ring-1 ring-black/10"
          )}
          style={{
            backgroundColor: color,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ["--tw-ring-color" as any]: color,
          }}
          onClick={() => onChange(color)}
          aria-label={color}
        />
      ))}
    </div>
  )
}
