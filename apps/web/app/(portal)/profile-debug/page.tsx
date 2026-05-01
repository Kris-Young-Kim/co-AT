"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface ProfileData {
  clerkUserId?: string
  clerkUser?: {
    id?: string
    email?: string
    firstName?: string
    lastName?: string
  }
  profile?: {
    id: string
    clerk_user_id: string
    email: string | null
    full_name: string | null
    role: string | null
    created_at: string | null
    updated_at: string | null
  } | null
  profileExists?: boolean
  error?: string | null
}

export default function ProfileDebugPage() {
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [updatingRole, setUpdatingRole] = useState(false)

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/profile")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setProfileData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류")
      console.error("프로필 조회 실패:", err)
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async () => {
    setCreating(true)
    setError(null)
    try {
      const response = await fetch("/api/profile/create", {
        method: "POST",
      })
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}${data.hint ? ` (${data.hint})` : ''}`
          : data.error || `HTTP error! status: ${response.status}`
        throw new Error(errorMessage)
      }
      
      // 프로필이 이미 존재하고 역할이 "user"인 경우 자동으로 "manager"로 업데이트
      if (data.needsRoleUpdate && data.profile?.role === "user") {
        console.log("[Profile Debug] 역할 자동 업데이트 시도...")
        const updateResponse = await fetch("/api/profile/update-role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: "manager" }),
        })
        
        if (updateResponse.ok) {
          const updateData = await updateResponse.json()
          alert("프로필이 이미 존재했습니다. 역할이 'manager'로 업데이트되었습니다!")
          await fetchProfile()
          return
        } else {
          const updateError = await updateResponse.json()
          throw new Error(`역할 업데이트 실패: ${updateError.error || updateError.details}`)
        }
      }
      
      setProfileData(data)
      alert(data.message || "프로필이 생성되었습니다!")
      // 프로필 새로고침
      await fetchProfile()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류"
      setError(errorMessage)
      console.error("프로필 생성 실패:", err)
    } finally {
      setCreating(false)
    }
  }

  const updateRole = async (newRole: "user" | "staff" | "manager" | "admin") => {
    setUpdatingRole(true)
    setError(null)
    try {
      const response = await fetch("/api/profile/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}`
          : data.error || `HTTP error! status: ${response.status}`
        throw new Error(errorMessage)
      }
      
      alert(data.message || "역할이 업데이트되었습니다!")
      // 프로필 새로고침
      await fetchProfile()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류"
      setError(errorMessage)
      console.error("역할 업데이트 실패:", err)
    } finally {
      setUpdatingRole(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const hasAdminRole = profileData?.profile?.role === "manager" || profileData?.profile?.role === "staff" || profileData?.profile?.role === "admin"
  const roleColor = hasAdminRole ? "bg-green-500" : profileData?.profile?.role === "user" ? "bg-blue-500" : "bg-gray-500"

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          프로필 상태 확인
        </h1>
        <p className="text-muted-foreground">
          현재 로그인한 사용자의 프로필 정보를 확인하고 관리할 수 있습니다
        </p>
      </div>

      <div className="space-y-6">
        {/* Clerk 사용자 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Clerk 사용자 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                로딩 중...
              </div>
            ) : profileData?.clerkUser ? (
              <div className="space-y-2">
                <div>
                  <span className="font-medium">ID:</span>{" "}
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {profileData.clerkUserId}
                  </code>
                </div>
                <div>
                  <span className="font-medium">이메일:</span> {profileData.clerkUser.email || "없음"}
                </div>
                <div>
                  <span className="font-medium">이름:</span>{" "}
                  {profileData.clerkUser.firstName || ""}{" "}
                  {profileData.clerkUser.lastName || ""}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Clerk 사용자 정보를 불러올 수 없습니다</p>
            )}
          </CardContent>
        </Card>

        {/* Supabase 프로필 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {profileData?.profileExists ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Supabase 프로필 정보
            </CardTitle>
            <CardDescription>
              {profileData?.profileExists
                ? "프로필이 존재합니다"
                : "프로필이 없습니다. 아래 버튼을 클릭하여 생성하세요"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                로딩 중...
              </div>
            ) : profileData?.profile ? (
              <div className="space-y-4">
                <div>
                  <span className="font-medium">프로필 ID:</span>{" "}
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {profileData.profile.id}
                  </code>
                </div>
                <div>
                  <span className="font-medium">역할 (Role):</span>{" "}
                  <Badge className={roleColor}>
                    {profileData.profile.role || "없음"}
                  </Badge>
                  {hasAdminRole && (
                    <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                      관리자 권한 있음
                    </Badge>
                  )}
                </div>
                <div>
                  <span className="font-medium">이메일:</span> {profileData.profile.email || "없음"}
                </div>
                <div>
                  <span className="font-medium">이름:</span> {profileData.profile.full_name || "없음"}
                </div>
                {profileData.profile.created_at && (
                  <div>
                    <span className="font-medium">생성일:</span>{" "}
                    {new Date(profileData.profile.created_at).toLocaleString("ko-KR")}
                  </div>
                )}
                {!hasAdminRole && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          관리자 권한이 없습니다
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          현재 역할: <strong>{profileData.profile.role || "없음"}</strong>
                          <br />
                          관리자 권한을 얻으려면 역할이 <strong>"manager"</strong>, <strong>"staff"</strong>, 또는 <strong>"admin"</strong>이어야 합니다.
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Button
                            onClick={() => updateRole("manager")}
                            disabled={updatingRole}
                            size="sm"
                          >
                            {updatingRole ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                업데이트 중...
                              </>
                            ) : (
                              "역할을 Manager로 변경"
                            )}
                          </Button>
                          <Button
                            onClick={() => updateRole("staff")}
                            disabled={updatingRole}
                            size="sm"
                            variant="outline"
                          >
                            {updatingRole ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                업데이트 중...
                              </>
                            ) : (
                              "역할을 Staff로 변경"
                            )}
                          </Button>
                          <Button
                            onClick={() => updateRole("admin")}
                            disabled={updatingRole}
                            size="sm"
                            variant="outline"
                            className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                          >
                            {updatingRole ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                업데이트 중...
                              </>
                            ) : (
                              "역할을 Admin으로 변경"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : profileData?.error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                  <strong>오류:</strong> {profileData.error}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                  프로필이 없습니다. 프로필을 생성하면 관리자 권한(manager)이 자동으로 부여됩니다.
                </p>
                <Button onClick={createProfile} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    "프로필 생성 (Manager 권한)"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <Card>
          <CardHeader>
            <CardTitle>액션</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={fetchProfile} variant="outline">
              프로필 새로고침
            </Button>
            {!profileData?.profileExists && (
              <Button onClick={createProfile} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  "프로필 생성"
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 에러 메시지 */}
        {error && (
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">오류</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

