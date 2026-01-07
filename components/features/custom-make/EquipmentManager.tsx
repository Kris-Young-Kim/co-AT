"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  type EquipmentItem,
} from "@/actions/custom-make-actions"
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Package,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  User,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

const EQUIPMENT_TYPES = [
  { value: "3d_printer", label: "3D프린터" },
  { value: "cnc", label: "CNC" },
  { value: "laser_cutter", label: "레이저 커터" },
  { value: "3d_scanner", label: "3D 스캐너" },
  { value: "other", label: "기타" },
] as const

const EQUIPMENT_STATUS = [
  { value: "available", label: "사용가능", color: "bg-green-500" },
  { value: "in_use", label: "사용중", color: "bg-blue-500" },
  { value: "maintenance", label: "점검중", color: "bg-yellow-500" },
  { value: "broken", label: "고장", color: "bg-red-500" },
  { value: "reserved", label: "예약됨", color: "bg-purple-500" },
] as const

interface EquipmentManagerProps {
  initialEquipment?: EquipmentItem[]
}

export function EquipmentManager({ initialEquipment = [] }: EquipmentManagerProps) {
  const [equipment, setEquipment] = useState<EquipmentItem[]>(initialEquipment)
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    location: "",
    specifications: "",
  })

  // 장비 목록 새로고침
  const refreshEquipment = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getEquipment({
        type: filterType !== "all" ? filterType : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
      })
      if (result.success && result.equipment) {
        setEquipment(result.equipment)
      } else {
        setError(result.error || "장비 목록을 불러오는데 실패했습니다")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "예상치 못한 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshEquipment()
  }, [filterType, filterStatus])

  // 장비 등록/수정 다이얼로그 열기
  const handleOpenDialog = (equipment?: EquipmentItem) => {
    if (equipment) {
      setSelectedEquipment(equipment)
      setFormData({
        name: equipment.name || "",
        type: equipment.type || "",
        manufacturer: equipment.manufacturer || "",
        model: equipment.model || "",
        serial_number: equipment.serial_number || "",
        location: equipment.location || "",
        specifications:
          equipment.specifications && typeof equipment.specifications === "object"
            ? JSON.stringify(equipment.specifications, null, 2)
            : "",
      })
    } else {
      setSelectedEquipment(null)
      setFormData({
        name: "",
        type: "",
        manufacturer: "",
        model: "",
        serial_number: "",
        location: "",
        specifications: "",
      })
    }
    setIsDialogOpen(true)
  }

  // 장비 저장
  const handleSave = async () => {
    if (!formData.name || !formData.type) {
      setError("장비명과 타입은 필수입니다")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let specifications = null
      if (formData.specifications) {
        try {
          specifications = JSON.parse(formData.specifications)
        } catch {
          setError("사양 정보는 유효한 JSON 형식이어야 합니다")
          setIsLoading(false)
          return
        }
      }

      const result = selectedEquipment
        ? await updateEquipment(selectedEquipment.id, {
            name: formData.name,
            type: formData.type,
            manufacturer: formData.manufacturer || undefined,
            model: formData.model || undefined,
            serial_number: formData.serial_number || undefined,
            location: formData.location || undefined,
            specifications,
          })
        : await createEquipment({
            name: formData.name,
            type: formData.type,
            manufacturer: formData.manufacturer || undefined,
            model: formData.model || undefined,
            serial_number: formData.serial_number || undefined,
            location: formData.location || undefined,
            specifications,
          })

      if (result.success) {
        setIsDialogOpen(false)
        refreshEquipment()
      } else {
        setError(result.error || "저장에 실패했습니다")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "예상치 못한 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  // 장비 삭제
  const handleDelete = async () => {
    if (!deleteTargetId) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await deleteEquipment(deleteTargetId)
      if (result.success) {
        setIsDeleteDialogOpen(false)
        setDeleteTargetId(null)
        refreshEquipment()
      } else {
        setError(result.error || "삭제에 실패했습니다")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "예상치 못한 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  // 상태 변경
  const handleStatusChange = async (id: string, status: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateEquipment(id, { status })
      if (result.success) {
        refreshEquipment()
      } else {
        setError(result.error || "상태 변경에 실패했습니다")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "예상치 못한 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  // 통계 계산
  const stats = {
    total: equipment.length,
    available: equipment.filter((e) => e.status === "available").length,
    inUse: equipment.filter((e) => e.status === "in_use").length,
    maintenance: equipment.filter((e) => e.status === "maintenance").length,
    broken: equipment.filter((e) => e.status === "broken").length,
    reserved: equipment.filter((e) => e.status === "reserved").length,
  }

  const getStatusBadge = (status: string | null) => {
    const statusInfo = EQUIPMENT_STATUS.find((s) => s.value === status)
    if (!statusInfo) return null

    return (
      <Badge
        variant="outline"
        className={cn("text-white", statusInfo.color)}
      >
        {statusInfo.label}
      </Badge>
    )
  }

  const getTypeLabel = (type: string | null) => {
    const typeInfo = EQUIPMENT_TYPES.find((t) => t.value === type)
    return typeInfo?.label || type || "-"
  }

  const filteredEquipment = equipment.filter((e) => {
    if (filterType !== "all" && e.type !== filterType) return false
    if (filterStatus !== "all" && e.status !== filterStatus) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">전체</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">사용가능</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">사용중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inUse}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">점검중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">고장</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.broken}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">예약됨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.reserved}</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 액션 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>장비 목록</CardTitle>
              <CardDescription>3D프린터, CNC 등 제작 장비 관리</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              장비 등록
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 필터 */}
          <div className="mb-4 flex gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="장비 타입" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 타입</SelectItem>
                {EQUIPMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="장비 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                {EQUIPMENT_STATUS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 장비 테이블 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>장비명</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead>제조사/모델</TableHead>
                  <TableHead>위치</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && filteredEquipment.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredEquipment.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      등록된 장비가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEquipment.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{getTypeLabel(item.type)}</TableCell>
                      <TableCell>
                        {item.manufacturer || item.model
                          ? `${item.manufacturer || ""} ${item.model || ""}`.trim()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {item.location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.status || "available"}
                          onValueChange={(value) => handleStatusChange(item.id, value)}
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EQUIPMENT_STATUS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteTargetId(item.id)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 장비 등록/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEquipment ? "장비 수정" : "장비 등록"}
            </DialogTitle>
            <DialogDescription>
              {selectedEquipment
                ? "장비 정보를 수정합니다"
                : "새로운 장비를 등록합니다"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                장비명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 3D프린터 #1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                장비 타입 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="장비 타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">제조사</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  placeholder="예: Creality"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">모델명</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="예: Ender-3"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number">시리얼 번호</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) =>
                  setFormData({ ...formData, serial_number: e.target.value })
                }
                placeholder="시리얼 번호"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">위치</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="예: 제작실 1층"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specifications">사양 (JSON 형식)</Label>
              <Textarea
                id="specifications"
                value={formData.specifications}
                onChange={(e) =>
                  setFormData({ ...formData, specifications: e.target.value })
                }
                placeholder='{"max_size": "200x200x200", "material": "PLA, ABS"}'
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                장비 사양을 JSON 형식으로 입력하세요 (선택사항)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>장비 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 장비를 삭제하시겠습니까? 사용 중인 장비는 삭제할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
