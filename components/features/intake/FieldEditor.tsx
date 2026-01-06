"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FormField, FieldType, ValidationRule } from "@/lib/types/form-builder.types"
import { Plus, Trash2 } from "lucide-react"

interface FieldEditorProps {
  field: FormField
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (field: FormField) => void
}

const fieldTypes: Array<{ value: FieldType; label: string }> = [
  { value: "text", label: "텍스트" },
  { value: "number", label: "숫자" },
  { value: "email", label: "이메일" },
  { value: "tel", label: "전화번호" },
  { value: "date", label: "날짜" },
  { value: "datetime", label: "날짜/시간" },
  { value: "time", label: "시간" },
  { value: "textarea", label: "여러 줄 텍스트" },
  { value: "select", label: "선택 (단일)" },
  { value: "multiselect", label: "선택 (복수)" },
  { value: "checkbox", label: "체크박스" },
  { value: "radio", label: "라디오 버튼" },
  { value: "boolean", label: "예/아니오" },
  { value: "file", label: "파일" },
  { value: "image", label: "이미지" },
  { value: "range", label: "범위" },
  { value: "color", label: "색상" },
]

export function FieldEditor({
  field: initialField,
  open,
  onOpenChange,
  onSave,
}: FieldEditorProps) {
  const [field, setField] = useState<FormField>(initialField)
  const [newOptionLabel, setNewOptionLabel] = useState("")
  const [newOptionValue, setNewOptionValue] = useState("")

  useEffect(() => {
    setField(initialField)
  }, [initialField, open])

  const handleSave = () => {
    onSave(field)
    onOpenChange(false)
  }

  const handleAddOption = () => {
    if (!newOptionLabel || !newOptionValue) return

    const newOptions = [
      ...(field.options || []),
      { label: newOptionLabel, value: newOptionValue },
    ]

    setField({ ...field, options: newOptions })
    setNewOptionLabel("")
    setNewOptionValue("")
  }

  const handleRemoveOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index) || []
    setField({ ...field, options: newOptions })
  }

  const needsOptions = ["select", "multiselect", "radio"].includes(field.type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>필드 편집</DialogTitle>
          <DialogDescription>
            필드의 속성을 수정하고 옵션을 설정할 수 있습니다
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList>
            <TabsTrigger value="basic">기본 설정</TabsTrigger>
            <TabsTrigger value="validation">검증 규칙</TabsTrigger>
            <TabsTrigger value="layout">레이아웃</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="field-label">필드 라벨 *</Label>
                <Input
                  id="field-label"
                  value={field.label}
                  onChange={(e) => setField({ ...field, label: e.target.value })}
                  placeholder="필드 이름"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-name">필드 이름 (name) *</Label>
                <Input
                  id="field-name"
                  value={field.name}
                  onChange={(e) => setField({ ...field, name: e.target.value })}
                  placeholder="field_name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-type">필드 타입 *</Label>
                <Select
                  value={field.type}
                  onValueChange={(value: FieldType) => {
                    setField({
                      ...field,
                      type: value,
                      // 타입 변경 시 옵션 초기화 (필요한 경우)
                      options:
                        needsOptions && !["select", "multiselect", "radio"].includes(value)
                          ? undefined
                          : field.options,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-placeholder">플레이스홀더</Label>
                <Input
                  id="field-placeholder"
                  value={field.placeholder || ""}
                  onChange={(e) =>
                    setField({ ...field, placeholder: e.target.value })
                  }
                  placeholder="입력 예시..."
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="field-description">설명</Label>
                <Textarea
                  id="field-description"
                  value={field.description || ""}
                  onChange={(e) =>
                    setField({ ...field, description: e.target.value })
                  }
                  rows={2}
                  placeholder="필드에 대한 설명을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-default">기본값</Label>
                <Input
                  id="field-default"
                  value={field.defaultValue?.toString() || ""}
                  onChange={(e) =>
                    setField({ ...field, defaultValue: e.target.value })
                  }
                  placeholder="기본값"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="field-required"
                  checked={field.required || false}
                  onCheckedChange={(checked) =>
                    setField({ ...field, required: checked === true })
                  }
                />
                <Label htmlFor="field-required" className="cursor-pointer">
                  필수 항목
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="field-disabled"
                  checked={field.disabled || false}
                  onCheckedChange={(checked) =>
                    setField({ ...field, disabled: checked === true })
                  }
                />
                <Label htmlFor="field-disabled" className="cursor-pointer">
                  비활성화
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="field-readonly"
                  checked={field.readonly || false}
                  onCheckedChange={(checked) =>
                    setField({ ...field, readonly: checked === true })
                  }
                />
                <Label htmlFor="field-readonly" className="cursor-pointer">
                  읽기 전용
                </Label>
              </div>
            </div>

            {/* 타입별 추가 옵션 */}
            {field.type === "number" || field.type === "range" ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="field-min">최소값</Label>
                  <Input
                    id="field-min"
                    type="number"
                    value={field.min || ""}
                    onChange={(e) =>
                      setField({
                        ...field,
                        min: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-max">최대값</Label>
                  <Input
                    id="field-max"
                    type="number"
                    value={field.max || ""}
                    onChange={(e) =>
                      setField({
                        ...field,
                        max: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-step">증가값</Label>
                  <Input
                    id="field-step"
                    type="number"
                    value={field.step || ""}
                    onChange={(e) =>
                      setField({
                        ...field,
                        step: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
            ) : null}

            {field.type === "textarea" ? (
              <div className="space-y-2">
                <Label htmlFor="field-rows">행 수</Label>
                <Input
                  id="field-rows"
                  type="number"
                  value={field.rows || 4}
                  onChange={(e) =>
                    setField({
                      ...field,
                      rows: e.target.value ? Number(e.target.value) : 4,
                    })
                  }
                />
              </div>
            ) : null}

            {(field.type === "file" || field.type === "image") && (
              <div className="space-y-2">
                <Label htmlFor="field-accept">허용 파일 형식</Label>
                <Input
                  id="field-accept"
                  value={field.accept || ""}
                  onChange={(e) => setField({ ...field, accept: e.target.value })}
                  placeholder="예: .pdf,.doc,.docx 또는 image/*"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="field-multiple"
                    checked={field.multiple || false}
                    onCheckedChange={(checked) =>
                      setField({ ...field, multiple: checked === true })
                    }
                  />
                  <Label htmlFor="field-multiple" className="cursor-pointer">
                    여러 파일 선택 허용
                  </Label>
                </div>
              </div>
            )}

            {/* 옵션 설정 (select, multiselect, radio) */}
            {needsOptions && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">옵션 목록</Label>
                </div>
                <div className="space-y-2">
                  {field.options?.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 border rounded-md"
                    >
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          value={option.label}
                          onChange={(e) => {
                            const newOptions = [...(field.options || [])]
                            newOptions[index].label = e.target.value
                            setField({ ...field, options: newOptions })
                          }}
                          placeholder="라벨"
                        />
                        <Input
                          value={String(option.value)}
                          onChange={(e) => {
                            const newOptions = [...(field.options || [])]
                            newOptions[index].value = e.target.value
                            setField({ ...field, options: newOptions })
                          }}
                          placeholder="값"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="옵션 라벨"
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddOption()
                      }
                    }}
                  />
                  <Input
                    placeholder="옵션 값"
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddOption()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddOption}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <div className="space-y-4">
              <Label className="text-base font-semibold">검증 규칙</Label>
              <p className="text-sm text-muted-foreground">
                필드 값에 대한 검증 규칙을 설정할 수 있습니다
              </p>
              {/* 검증 규칙 편집 UI는 향후 확장 가능 */}
              <div className="p-4 border rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  검증 규칙 편집 기능은 향후 추가 예정입니다
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-width">필드 너비</Label>
              <Select
                value={field.width || "full"}
                onValueChange={(value: "full" | "half" | "third" | "quarter") =>
                  setField({ ...field, width: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">전체 너비</SelectItem>
                  <SelectItem value="half">절반 너비</SelectItem>
                  <SelectItem value="third">1/3 너비</SelectItem>
                  <SelectItem value="quarter">1/4 너비</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
