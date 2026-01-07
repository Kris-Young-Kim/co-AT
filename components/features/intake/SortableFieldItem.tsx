"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { GripVertical, Edit, Trash2 } from "lucide-react"
import { DynamicFormField } from "./DynamicFormField"
import type { FormField, FormData } from "@/lib/types/form-builder.types"

interface SortableFieldItemProps {
  field: FormField
  formData: FormData
  onDataChange: (data: FormData) => void
  onEdit: (field: FormField) => void
  onDelete: (fieldId: string) => void
  readOnly?: boolean
}

export function SortableFieldItem({
  field,
  formData,
  onDataChange,
  onEdit,
  onDelete,
  readOnly = false,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    disabled: readOnly,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 border rounded-lg bg-card transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {!readOnly && (
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <DynamicFormField
            field={field}
            value={formData[field.name]}
            onChange={(value) => {
              onDataChange({
                ...formData,
                [field.name]: value,
              })
            }}
            readOnly={readOnly}
          />
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(field)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(field.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
