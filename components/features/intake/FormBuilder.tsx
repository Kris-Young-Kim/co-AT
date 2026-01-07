"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  DndContext,
  useDraggable,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import {
  Plus,
  GripVertical,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Save,
  FileText,
  Settings,
} from "lucide-react"
import type {
  FormTemplate,
  FormSection,
  FormField,
  FieldType,
  FormData,
} from "@/lib/types/form-builder.types"
import { DynamicFormField } from "./DynamicFormField"
import { FieldEditor } from "./FieldEditor"
import { SortableFieldItem } from "./SortableFieldItem"

interface FormBuilderProps {
  template: FormTemplate
  formData: FormData
  onDataChange: (data: FormData) => void
  onTemplateChange?: (template: FormTemplate) => void
  readOnly?: boolean
}

export function FormBuilder({
  template,
  formData,
  onDataChange,
  onTemplateChange,
  readOnly = false,
}: FormBuilderProps) {
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [editingSection, setEditingSection] = useState<FormSection | null>(null)
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false)
  const [isSectionEditorOpen, setIsSectionEditorOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(template.sections.map((s) => s.id))
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !onTemplateChange) return

    const source = {
      droppableId: active.data.current?.droppableId || "",
      index: active.data.current?.index || 0,
    }
    const destination = {
      droppableId: over.data.current?.droppableId || "",
      index: over.data.current?.index || 0,
    }
    const newSections = [...template.sections]

    // 섹션 재배치
    if (source.droppableId === "sections" && destination.droppableId === "sections") {
      const [removed] = newSections.splice(source.index, 1)
      newSections.splice(destination.index, 0, removed)
      newSections.forEach((section, index) => {
        section.order = index
      })
    } else {
      // 필드 재배치 (같은 섹션 내)
      const sourceSectionId = source.droppableId.replace("section-", "")
      const destSectionId = destination.droppableId.replace("section-", "")
      
      if (sourceSectionId === destSectionId) {
        const section = newSections.find((s) => s.id === sourceSectionId)
        if (section) {
          const [removed] = section.fields.splice(source.index, 1)
          section.fields.splice(destination.index, 0, removed)
        }
      } else {
        // 다른 섹션으로 필드 이동
        const sourceSection = newSections.find((s) => s.id === sourceSectionId)
        const destSection = newSections.find((s) => s.id === destSectionId)
        if (sourceSection && destSection) {
          const [removed] = sourceSection.fields.splice(source.index, 1)
          destSection.fields.splice(destination.index, 0, removed)
        }
      }
    }

    onTemplateChange({
      ...template,
      sections: newSections,
      updatedAt: new Date().toISOString(),
    })
  }

  const handleAddField = (sectionId: string) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "새 필드",
      name: `field_${Date.now()}`,
      required: false,
      width: "full",
    }

    const newSections = template.sections.map((section) =>
      section.id === sectionId
        ? { ...section, fields: [...section.fields, newField] }
        : section
    )

    if (onTemplateChange) {
      onTemplateChange({
        ...template,
        sections: newSections,
        updatedAt: new Date().toISOString(),
      })
    }

    setEditingField(newField)
    setIsFieldEditorOpen(true)
  }

  const handleEditField = (field: FormField) => {
    setEditingField(field)
    setIsFieldEditorOpen(true)
  }

  const handleDeleteField = (sectionId: string, fieldId: string) => {
    const newSections = template.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            fields: section.fields.filter((f) => f.id !== fieldId),
          }
        : section
    )

    if (onTemplateChange) {
      onTemplateChange({
        ...template,
        sections: newSections,
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const handleAddSection = () => {
    const newSection: FormSection = {
      id: `section-${Date.now()}`,
      title: "새 섹션",
      fields: [],
      order: template.sections.length,
    }

    if (onTemplateChange) {
      onTemplateChange({
        ...template,
        sections: [...template.sections, newSection],
        updatedAt: new Date().toISOString(),
      })
    }

    setEditingSection(newSection)
    setIsSectionEditorOpen(true)
  }

  const handleFieldUpdate = (updatedField: FormField) => {
    const newSections = template.sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) =>
        field.id === updatedField.id ? updatedField : field
      ),
    }))

    if (onTemplateChange) {
      onTemplateChange({
        ...template,
        sections: newSections,
        updatedAt: new Date().toISOString(),
      })
    }

    setEditingField(null)
    setIsFieldEditorOpen(false)
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className="space-y-6">
      <DndContext onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          {template.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <Card key={section.id} className="shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {section.title}
                      </CardTitle>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {section.description}
                        </p>
                      )}
                    </div>
                    {!readOnly && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSection(section)
                            setIsSectionEditorOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSection(section.id)}
                        >
                          {expandedSections.has(section.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddField(section.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                {expandedSections.has(section.id) && (
                  <CardContent className="pt-6">
                    <SortableContext
                      items={section.fields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {section.fields.map((field) => (
                          <SortableFieldItem
                            key={field.id}
                            field={field}
                            formData={formData}
                            onDataChange={onDataChange}
                            onEdit={handleEditField}
                            onDelete={(fieldId) =>
                              handleDeleteField(section.id, fieldId)
                            }
                            readOnly={readOnly}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </CardContent>
                )}
              </Card>
            ))}
        </div>
      </DndContext>

      {!readOnly && (
        <Button
          onClick={handleAddSection}
          variant="outline"
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          섹션 추가
        </Button>
      )}

      {/* 필드 편집 다이얼로그 */}
      {editingField && (
        <FieldEditor
          field={editingField}
          open={isFieldEditorOpen}
          onOpenChange={setIsFieldEditorOpen}
          onSave={handleFieldUpdate}
        />
      )}
    </div>
  )
}
