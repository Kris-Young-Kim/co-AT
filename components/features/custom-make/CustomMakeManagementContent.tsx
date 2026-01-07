"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  getCustomMakes,
  updateCustomMakeProgress,
  assignEquipment,
  getEquipment,
  type CustomMakeWithDetails,
  type EquipmentItem,
} from "@/actions/custom-make-actions"
import {
  Package,
  Wrench,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Settings,
  FileText,
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ProgressTracker } from "./ProgressTracker"
import { CustomMakeFormDialog } from "./CustomMakeFormDialog"

interface CustomMakeManagementContentProps {
  initialCustomMakes?: CustomMakeWithDetails[]
}

const progressStatusMap: Record<string, { label: string; color: string }> = {
  design: { label: "설계", color: "bg-blue-500" },
  manufacturing: { label: "제작", color: "bg-yellow-500" },
  inspection: { label: "검수", color: "bg-purple-500" },
  delivery: { label: "납품", color: "bg-green-500" },
  completed: { label: "완료", color: "bg-gray-500" },
  cancelled: { label: "취소", color: "bg-red-500" },
}

export function CustomMakeManagementContent({
  initialCustomMakes = [],
}: CustomMakeManagementContentProps) {
  const router = useRouter()
  const [customMakes, setCustomMakes] = useState<CustomMakeWithDetails[]>(initialCustomMakes)
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedCustomMake, setSelectedCustomMake] = useState<CustomMakeWithDetails | null>(null)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false)
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false)
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // 맞춤제작 목록 새로고침
  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const result = await getCustomMakes({
        progress_status: statusFilter !== "all" ? statusFilter : undefined,
      })

      if (result.success) {
        setCustomMakes(result.customMakes || [])
      }
    } catch (error) {
      console.error("맞춤제작 목록 새로고침 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 필터 변경 시 새로고침
  useEffect(() => {
    handleRefresh()
  }, [statusFilter])

  // 장비 목록 로드
  useEffect(() => {
    if (isEquipmentDialogOpen) {
      loadAvailableEquipment()
    }
  }, [isEquipmentDialogOpen])

  const loadAvailableEquipment = async () => {
    try {
      const result = await getEquipment({ status: "available" })
      if (result.success) {
        setAvailableEquipment(result.equipment || [])
      }
    } catch (error) {
      console.error("장비 목록 로드 실패:", error)
    }
  }

  // 진행도 업데이트
  const handleProgressUpdate = async (progress: {
    progress_status: string
    progress_percentage: number
    notes?: string
  }) => {
    if (!selectedCustomMake) return

    setIsProcessing(true)
    try {
      const result = await updateCustomMakeProgress(selectedCustomMake.id, progress)
      if (result.success) {
        setIsProgressDialogOpen(false)
        setSelectedCustomMake(null)
        handleRefresh()
        router.refresh()
      }
    } catch (error) {
      console.error("진행도 업데이트 실패:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 장비 배정
  const handleEquipmentAssign = async (equipmentId: string) => {
    if (!selectedCustomMake) return

    setIsProcessing(true)
    try {
      const result = await assignEquipment(selectedCustomMake.id, equipmentId)
      if (result.success) {
        setIsEquipmentDialogOpen(false)
        setSelectedCustomMake(null)
        handleRefresh()
        router.refresh()
      }
    } catch (error) {
      console.error("장비 배정 실패:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 상태별 통계
  const stats = {
    total: customMakes.length,
    design: customMakes.filter((cm) => cm.progress_status === "design").length,
    manufacturing: customMakes.filter((cm) => cm.progress_status === "manufacturing").length,
    inspection: customMakes.filter((cm) => cm.progress_status === "inspection").length,
    delivery: customMakes.filter((cm) => cm.progress_status === "delivery").length,
    completed: customMakes.filter((cm) => cm.progress_status === "completed").length,
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">설계</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.design}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">제작</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.manufacturing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">검수</CardTitle>
            <Settings className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.inspection}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">납품</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivery}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 새로고침 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>맞춤제작 목록</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="진행 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="design">설계</SelectItem>
                  <SelectItem value="manufacturing">제작</SelectItem>
                  <SelectItem value="inspection">검수</SelectItem>
                  <SelectItem value="delivery">납품</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              <Button size="sm" onClick={() => setIsFormDialogOpen(true)}>
                새 프로젝트
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : customMakes.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 맞춤제작 프로젝트가 없습니다</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제작 품목</TableHead>
                  <TableHead>대상자</TableHead>
                  <TableHead>진행 상태</TableHead>
                  <TableHead>진행률</TableHead>
                  <TableHead>장비</TableHead>
                  <TableHead>예상 완료일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customMakes.map((customMake) => {
                  const statusInfo = progressStatusMap[customMake.progress_status || "design"] || {
                    label: customMake.progress_status || "설계",
                    color: "bg-gray-500",
                  }

                  return (
                    <TableRow key={customMake.id}>
                      <TableCell className="font-medium">
                        {customMake.item_name}
                        {customMake.item_description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {customMake.item_description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{customMake.client_name || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("flex items-center gap-1", statusInfo.color)}
                        >
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 w-32">
                          <Progress
                            value={customMake.progress_percentage || 0}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-8 text-right">
                            {customMake.progress_percentage || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customMake.equipment_name ? (
                          <Badge variant="secondary">{customMake.equipment_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">미배정</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customMake.expected_completion_date ? (
                          format(new Date(customMake.expected_completion_date), "yyyy-MM-dd", {
                            locale: ko,
                          })
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomMake(customMake)
                              setIsProgressDialogOpen(true)
                            }}
                          >
                            진행도
                          </Button>
                          {!customMake.equipment_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomMake(customMake)
                                setIsEquipmentDialogOpen(true)
                              }}
                            >
                              장비 배정
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 맞춤제작 프로젝트 생성 다이얼로그 */}
      <CustomMakeFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onSuccess={() => {
          handleRefresh()
          router.refresh()
        }}
      />

      {/* 진행도 업데이트 다이얼로그 */}
      {selectedCustomMake && (
        <ProgressTracker
          open={isProgressDialogOpen}
          onOpenChange={setIsProgressDialogOpen}
          customMake={selectedCustomMake}
          onProgressUpdate={handleProgressUpdate}
          isProcessing={isProcessing}
        />
      )}

      {/* 장비 배정 다이얼로그 */}
      {selectedCustomMake && (
        <EquipmentAssignDialog
          open={isEquipmentDialogOpen}
          onOpenChange={setIsEquipmentDialogOpen}
          customMake={selectedCustomMake}
          availableEquipment={availableEquipment}
          onAssign={handleEquipmentAssign}
          isProcessing={isProcessing}
        />
      )}
    </div>
  )
}

// 장비 배정 다이얼로그 컴포넌트
function EquipmentAssignDialog({
  open,
  onOpenChange,
  customMake,
  availableEquipment,
  onAssign,
  isProcessing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customMake: CustomMakeWithDetails
  availableEquipment: EquipmentItem[]
  onAssign: (equipmentId: string) => void
  isProcessing: boolean
}) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("")

  const equipmentTypeMap: Record<string, string> = {
    "3d_printer": "3D프린터",
    cnc: "CNC",
    laser_cutter: "레이저 커터",
    "3d_scanner": "3D 스캐너",
    other: "기타",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>장비 배정</DialogTitle>
          <DialogDescription>
            {customMake.item_name} 제작에 사용할 장비를 선택하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {availableEquipment.length === 0 ? (
            <p className="text-sm text-muted-foreground">사용 가능한 장비가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              <Label>장비 선택</Label>
              <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="장비를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableEquipment.map((equipment) => (
                    <SelectItem key={equipment.id} value={equipment.id}>
                      {equipment.name} ({equipmentTypeMap[equipment.type || ""] || equipment.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            취소
          </Button>
          <Button
            onClick={() => onAssign(selectedEquipmentId)}
            disabled={isProcessing || !selectedEquipmentId}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              "배정"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
