"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  getInventoryList,
  type InventoryItem,
  type InventoryListResult,
} from "@/actions/inventory-actions"
import { InventoryList } from "./InventoryList"
import { InventoryFormDialog } from "./InventoryFormDialog"
import { QRCodeScanner } from "./QRCodeScanner"
import {
  Plus,
  Search,
  Package,
  PackageCheck,
  PackageX,
  Wrench,
  SprayCan,
  Trash2,
  QrCode,
  Grid3x3,
  List,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface InventoryManagementContentProps {
  initialInventory: InventoryListResult
}

type ViewMode = "card" | "table"

export function InventoryManagementContent({
  initialInventory,
}: InventoryManagementContentProps) {
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>(
    initialInventory.items || []
  )
  const [total, setTotal] = useState(initialInventory.total || 0)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("card")

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [rentalFilter, setRentalFilter] = useState<string>("all")

  // 다이얼로그 상태
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  // 통계 계산
  const stats = {
    total: inventory.length,
    stored: inventory.filter((item) => item.status === "보관").length,
    rented: inventory.filter((item) => item.status === "대여중").length,
    repairing: inventory.filter((item) => item.status === "수리중").length,
    cleaning: inventory.filter((item) => item.status === "소독중").length,
    disposed: inventory.filter((item) => item.status === "폐기").length,
  }

  // 재고 목록 조회
  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const result = await getInventoryList({
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        is_rental_available:
          rentalFilter === "available"
            ? true
            : rentalFilter === "unavailable"
            ? false
            : undefined,
      })

      if (result.success && result.items) {
        setInventory(result.items)
        setTotal(result.total || 0)
      }
    } catch (error) {
      console.error("재고 목록 조회 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 검색어 변경 시 자동 검색 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, statusFilter, categoryFilter, rentalFilter])

  // 재고 등록/수정 완료 후 새로고침
  const handleFormSuccess = () => {
    setIsFormDialogOpen(false)
    setEditingItem(null)
    handleSearch()
    router.refresh()
  }

  // 재고 수정 시작
  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setIsFormDialogOpen(true)
  }

  // 재고 등록 시작
  const handleCreate = () => {
    setEditingItem(null)
    setIsFormDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* 통계 대시보드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">총 재고 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">보관</CardTitle>
            <PackageCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.stored}</div>
            <p className="text-xs text-muted-foreground">사용 가능</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대여중</CardTitle>
            <PackageX className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.rented}</div>
            <p className="text-xs text-muted-foreground">대여 중인 기기</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">수리중</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.repairing}</div>
            <p className="text-xs text-muted-foreground">수리 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">소독중</CardTitle>
            <SprayCan className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.cleaning}</div>
            <p className="text-xs text-muted-foreground">소독 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">폐기</CardTitle>
            <Trash2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.disposed}</div>
            <p className="text-xs text-muted-foreground">폐기된 기기</p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 영역 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>재고 목록</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsScannerOpen(true)}
                className="gap-2"
              >
                <QrCode className="h-4 w-4" />
                QR 스캔
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "card" ? "table" : "card")}
                className="gap-2"
              >
                {viewMode === "card" ? (
                  <>
                    <List className="h-4 w-4" />
                    테이블 뷰
                  </>
                ) : (
                  <>
                    <Grid3x3 className="h-4 w-4" />
                    카드 뷰
                  </>
                )}
              </Button>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                재고 등록
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* 검색 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="기기명, 자산번호, 제조사, 모델명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 상태 필터 */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="보관">보관</SelectItem>
                <SelectItem value="대여중">대여중</SelectItem>
                <SelectItem value="수리중">수리중</SelectItem>
                <SelectItem value="소독중">소독중</SelectItem>
                <SelectItem value="폐기">폐기</SelectItem>
              </SelectContent>
            </Select>

            {/* 카테고리 필터 */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                <SelectItem value="휠체어">휠체어</SelectItem>
                <SelectItem value="보행기">보행기</SelectItem>
                <SelectItem value="목발">목발</SelectItem>
                <SelectItem value="지팡이">지팡이</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>

            {/* 대여 가능 여부 필터 */}
            <Select value={rentalFilter} onValueChange={setRentalFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="대여 가능" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="available">대여 가능</SelectItem>
                <SelectItem value="unavailable">대여 불가</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 재고 목록 */}
      <InventoryList
        items={inventory}
        viewMode={viewMode}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSearch}
      />

      {/* 재고 등록/수정 다이얼로그 */}
      <InventoryFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        item={editingItem}
        onSuccess={handleFormSuccess}
      />

      {/* QR 코드 스캐너 */}
      <QRCodeScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScanSuccess={(item) => {
          handleEdit(item)
          setIsScannerOpen(false)
        }}
      />
    </div>
  )
}
