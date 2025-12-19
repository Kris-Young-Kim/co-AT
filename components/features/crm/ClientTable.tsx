"use client"

import { useState, useEffect } from "react"
import { searchClients, type ClientWithStats } from "@/actions/client-actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, User } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface ClientTableProps {
  initialClients?: ClientWithStats[]
  initialTotal?: number
}

export function ClientTable({ initialClients = [], initialTotal = 0 }: ClientTableProps) {
  const [clients, setClients] = useState<ClientWithStats[]>(initialClients)
  const [total, setTotal] = useState(initialTotal)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [disabilityType, setDisabilityType] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const result = await searchClients({
        query: searchQuery || undefined,
        disability_type: disabilityType || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      })

      if (result.success && result.clients) {
        setClients(result.clients)
        setTotal(result.total || 0)
      }
    } catch (error) {
      console.error("대상자 검색 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    handleSearch()
  }, [currentPage, disabilityType])

  // 검색어 변경 시 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        handleSearch()
      } else {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const totalPages = Math.ceil(total / itemsPerPage)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    try {
      return format(new Date(dateString), "yyyy-MM-dd", { locale: ko })
    } catch {
      return dateString
    }
  }

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "-"
    try {
      const birth = new Date(birthDate)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return `${age}세`
    } catch {
      return "-"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>대상자 목록</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 검색 및 필터 */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="이름 또는 생년월일(YYYY-MM-DD)로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={disabilityType} onValueChange={setDisabilityType}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="장애유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              <SelectItem value="지체장애">지체장애</SelectItem>
              <SelectItem value="뇌병변장애">뇌병변장애</SelectItem>
              <SelectItem value="시각장애">시각장애</SelectItem>
              <SelectItem value="청각장애">청각장애</SelectItem>
              <SelectItem value="언어장애">언어장애</SelectItem>
              <SelectItem value="지적장애">지적장애</SelectItem>
              <SelectItem value="자폐성장애">자폐성장애</SelectItem>
              <SelectItem value="정신장애">정신장애</SelectItem>
              <SelectItem value="신장장애">신장장애</SelectItem>
              <SelectItem value="심장장애">심장장애</SelectItem>
              <SelectItem value="호흡기장애">호흡기장애</SelectItem>
              <SelectItem value="간장애">간장애</SelectItem>
              <SelectItem value="안면장애">안면장애</SelectItem>
              <SelectItem value="장루·요루장애">장루·요루장애</SelectItem>
              <SelectItem value="뇌전증장애">뇌전증장애</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                검색 중...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                검색
              </>
            )}
          </Button>
        </div>

        {/* 결과 개수 */}
        <div className="mb-4 text-sm text-muted-foreground">
          총 {total}명의 대상자를 찾았습니다
        </div>

        {/* 테이블 */}
        {isLoading && clients.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : clients.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>검색 결과가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>생년월일</TableHead>
                    <TableHead>나이</TableHead>
                    <TableHead>성별</TableHead>
                    <TableHead>장애유형</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>신청 건수</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{formatDate(client.birth_date)}</TableCell>
                      <TableCell>{calculateAge(client.birth_date)}</TableCell>
                      <TableCell>{client.gender || "-"}</TableCell>
                      <TableCell>{client.disability_type || "-"}</TableCell>
                      <TableCell>{client.contact || "-"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {client.application_count || 0}건
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/clients/${client.id}`}>상세보기</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages} 페이지
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    이전
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}







