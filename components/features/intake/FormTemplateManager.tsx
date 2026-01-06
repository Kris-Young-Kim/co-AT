"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { Download, Upload, Trash2, FileText, Plus } from "lucide-react"
import type { FormTemplate } from "@/lib/types/form-builder.types"
import { defaultIntakeTemplate } from "@/lib/templates/default-intake-template"
// import { useToast } from "@/hooks/use-toast" // TODO: toast 시스템 추가

interface FormTemplateManagerProps {
  currentTemplate: FormTemplate
  onTemplateLoad: (template: FormTemplate) => void
  onTemplateSave: (template: FormTemplate) => void
}

export function FormTemplateManager({
  currentTemplate,
  onTemplateLoad,
  onTemplateSave,
}: FormTemplateManagerProps) {
  // const { toast } = useToast() // TODO: toast 시스템 추가
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")
  const [deletingTemplate, setDeletingTemplate] = useState<FormTemplate | null>(null)

  // 로컬 스토리지에서 템플릿 목록 불러오기
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = () => {
    try {
      const saved = localStorage.getItem("intake-form-templates")
      if (saved) {
        const parsed = JSON.parse(saved)
        setTemplates([defaultIntakeTemplate, ...parsed])
      } else {
        setTemplates([defaultIntakeTemplate])
      }
    } catch (e) {
      console.error("템플릿 불러오기 실패:", e)
      setTemplates([defaultIntakeTemplate])
    }
  }

  const saveTemplate = () => {
    if (!newTemplateName.trim()) {
    alert("템플릿 이름을 입력해주세요.")
      return
    }

    const newTemplate: FormTemplate = {
      ...currentTemplate,
      id: `template-${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDescription,
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    }

    const existingTemplates = templates.filter((t) => !t.isDefault)
    const updatedTemplates = [...existingTemplates, newTemplate]
    
    localStorage.setItem("intake-form-templates", JSON.stringify(updatedTemplates))
    onTemplateSave(newTemplate)
    loadTemplates()
    
    setIsSaveDialogOpen(false)
    setNewTemplateName("")
    setNewTemplateDescription("")
    
    alert("새 템플릿이 저장되었습니다.")
  }

  const deleteTemplate = (template: FormTemplate) => {
    if (template.isDefault) {
      alert("기본 템플릿은 삭제할 수 없습니다.")
      return
    }

    const updatedTemplates = templates.filter((t) => t.id !== template.id)
    localStorage.setItem(
      "intake-form-templates",
      JSON.stringify(updatedTemplates.filter((t) => !t.isDefault))
    )
    loadTemplates()
    
    setDeletingTemplate(null)
    alert("템플릿이 삭제되었습니다.")
  }

  const exportTemplate = (template: FormTemplate) => {
    const dataStr = JSON.stringify(template, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${template.name.replace(/\s+/g, "_")}_${template.version}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    alert("템플릿이 다운로드되었습니다.")
  }

  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as FormTemplate
        imported.id = `template-${Date.now()}`
        imported.createdAt = new Date().toISOString()
        imported.updatedAt = new Date().toISOString()
        imported.isDefault = false

        const existingTemplates = templates.filter((t) => !t.isDefault)
        const updatedTemplates = [...existingTemplates, imported]
        
        localStorage.setItem("intake-form-templates", JSON.stringify(updatedTemplates))
        loadTemplates()
        
        alert("템플릿이 성공적으로 가져와졌습니다.")
      } catch (err) {
        alert("템플릿 파일을 읽을 수 없습니다.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>템플릿 관리</CardTitle>
            <Button onClick={() => setIsSaveDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              현재 양식 저장
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{template.name}</h3>
                        {template.isDefault && (
                          <Badge variant="secondary">기본</Badge>
                        )}
                        <Badge variant="outline">v{template.version}</Badge>
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        섹션: {template.sections.length}개 | 필드:{" "}
                        {template.sections.reduce(
                          (sum, s) => sum + s.fields.length,
                          0
                        )}
                        개
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTemplateLoad(template)}
                      >
                        불러오기
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportTemplate(template)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!template.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTemplate(template)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>템플릿 가져오기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="import-template">JSON 파일 선택</Label>
              <Input
                id="import-template"
                type="file"
                accept=".json"
                onChange={importTemplate}
                className="mt-2"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              이전에 내보낸 템플릿 JSON 파일을 선택하여 가져올 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 템플릿 저장 다이얼로그 */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>템플릿 저장</DialogTitle>
            <DialogDescription>
              현재 양식을 새 템플릿으로 저장합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">템플릿 이름 *</Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="예: 상담 기록지 v2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">설명</Label>
              <Textarea
                id="template-description"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="템플릿에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={saveTemplate}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={(open) => !open && setDeletingTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>템플릿 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingTemplate?.name} 템플릿을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTemplate && deleteTemplate(deletingTemplate)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
