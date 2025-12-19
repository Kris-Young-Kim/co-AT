"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database.types"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { User, Phone, Calendar, MapPin, Home, Heart } from "lucide-react"

type Client = Database["public"]["Tables"]["clients"]["Row"]

interface ClientProfileCardProps {
  client: Client
}

export function ClientProfileCard({ client }: ClientProfileCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    try {
      return format(new Date(dateString), "yyyy년 MM월 dd일", { locale: ko })
    } catch {
      return dateString
    }
  }

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null
    try {
      const birth = new Date(birthDate)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age
    } catch {
      return null
    }
  }

  const age = calculateAge(client.birth_date)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            기본 정보
          </CardTitle>
          {client.gender && (
            <Badge variant="outline">{client.gender}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {/* 기본 정보 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">이름</p>
                <p className="text-sm text-muted-foreground">{client.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">생년월일</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(client.birth_date)}
                  {age !== null && ` (만 ${age}세)`}
                </p>
              </div>
            </div>

            {client.registration_number && (
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">등록번호</p>
                  <p className="text-sm text-muted-foreground">{client.registration_number}</p>
                </div>
              </div>
            )}

            {client.contact && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">연락처</p>
                  <p className="text-sm text-muted-foreground">{client.contact}</p>
                </div>
              </div>
            )}

            {client.guardian_contact && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">보호자 연락처</p>
                  <p className="text-sm text-muted-foreground">{client.guardian_contact}</p>
                </div>
              </div>
            )}
          </div>

          {/* 주소 및 주거 정보 */}
          <div className="space-y-3">
            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">주소</p>
                  <p className="text-sm text-muted-foreground">{client.address}</p>
                </div>
              </div>
            )}

            {client.housing_type && (
              <div className="flex items-start gap-3">
                <Home className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">주거형태</p>
                  <p className="text-sm text-muted-foreground">{client.housing_type}</p>
                </div>
              </div>
            )}

            {client.has_elevator !== null && (
              <div className="flex items-start gap-3">
                <Home className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">엘리베이터</p>
                  <p className="text-sm text-muted-foreground">
                    {client.has_elevator ? "있음" : "없음"}
                  </p>
                </div>
              </div>
            )}

            {client.obstacles && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">장애물</p>
                  <p className="text-sm text-muted-foreground">{client.obstacles}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 장애 정보 */}
        {(client.disability_type || client.disability_grade || client.disability_cause) && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">장애 정보</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {client.disability_type && (
                <div>
                  <p className="text-sm font-medium">장애유형</p>
                  <Badge variant="secondary" className="mt-1">
                    {client.disability_type}
                  </Badge>
                </div>
              )}
              {client.disability_grade && (
                <div>
                  <p className="text-sm font-medium">장애정도</p>
                  <p className="text-sm text-muted-foreground mt-1">{client.disability_grade}</p>
                </div>
              )}
              {client.disability_cause && (
                <div>
                  <p className="text-sm font-medium">장애발생원인</p>
                  <p className="text-sm text-muted-foreground mt-1">{client.disability_cause}</p>
                </div>
              )}
            </div>
            {client.disability_onset_date && (
              <div className="mt-3">
                <p className="text-sm font-medium">장애발생시기</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(client.disability_onset_date)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 경제 상황 */}
        {client.economic_status && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium mb-2">경제상황</p>
            <p className="text-sm text-muted-foreground">{client.economic_status}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}








