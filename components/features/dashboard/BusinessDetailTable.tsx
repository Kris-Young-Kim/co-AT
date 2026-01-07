"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { type BusinessDetailStats } from "@/actions/stats-actions"
import { FileText } from "lucide-react"

interface BusinessDetailTableProps {
  businessDetails: BusinessDetailStats[]
}

const STATUS_COLORS = {
  received: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  inProgress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function BusinessDetailTable({ businessDetails }: BusinessDetailTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          사업별 상세 통계
        </CardTitle>
        <CardDescription>
          5대 핵심 사업별 상태별 건수 및 세부 카테고리별 통계를 확인할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {businessDetails.map((business) => (
            <div key={business.category} className="space-y-4">
              <h3 className="text-lg font-semibold">{business.categoryLabel}</h3>

              {/* 상태별 통계 */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">전체</div>
                  <div className="text-2xl font-bold">{business.total}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">접수</div>
                  <div className="text-2xl font-bold text-blue-600">{business.received}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">진행</div>
                  <div className="text-2xl font-bold text-yellow-600">{business.inProgress}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">완료</div>
                  <div className="text-2xl font-bold text-green-600">{business.completed}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">취소</div>
                  <div className="text-2xl font-bold text-red-600">{business.cancelled}</div>
                </div>
              </div>

              {/* 세부 카테고리별 통계 */}
              {business.subCategories.length > 0 && (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>세부 카테고리</TableHead>
                        <TableHead className="text-right">건수</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {business.subCategories.map((subCat) => (
                        <TableRow key={subCat.subCategory}>
                          <TableCell className="font-medium">{subCat.label}</TableCell>
                          <TableCell className="text-right">{subCat.count.toLocaleString()}건</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
