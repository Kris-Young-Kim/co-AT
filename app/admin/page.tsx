"use client"

import { useSignIn, useUser } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Lock, Mail } from "lucide-react"

export default function AdminSignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/admin/dashboard'
  const { signIn, setActive, isLoaded } = useSignIn()
  const { user, isLoaded: userLoaded } = useUser()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  // 이미 로그인된 상태인지 확인하고 관리자 세션 설정
  useEffect(() => {
    if (!userLoaded) return

    if (user) {
      // 이미 로그인된 상태라면 관리자 세션 쿠키만 설정
      setIsCheckingSession(true)
      
      // 먼저 현재 세션 확인
      fetch('/api/admin/session', {
        method: 'GET',
      })
        .then(async (getResponse) => {
          if (getResponse.ok) {
            const sessionData = await getResponse.json()
            if (sessionData.hasAdminSession && sessionData.hasPermission) {
              // 이미 관리자 세션이 있고 권한이 있으면 바로 리다이렉트
              router.push(redirectUrl)
              return
            }
          }
          
          // 세션이 없거나 권한이 없으면 새로 설정 시도
          const postResponse = await fetch('/api/admin/session', {
            method: 'POST',
          })
          
          if (postResponse.ok) {
            // 세션 설정 성공 시 리다이렉트
            router.push(redirectUrl)
          } else {
            const data = await postResponse.json()
            console.error('[Admin Login] 세션 설정 실패:', data)
            
            // 프로필이 없는 경우 Clerk role이 "admin" 또는 "staff"인지 확인 후 자동 프로필 생성
            if (data.details?.includes('역할: 없음') || data.details?.includes('역할: None')) {
              console.log('[Admin Login] 프로필이 없음. Clerk role 확인 중...')
              
              // Clerk 사용자 정보에서 role 확인
              const clerkRole = user?.publicMetadata?.role as string || 
                                user?.privateMetadata?.role as string || 
                                null
              
              console.log('[Admin Login] Clerk role:', clerkRole)
              
              // Clerk role이 "admin" 또는 "staff"인 경우 프로필 생성 시도
              if (clerkRole === 'admin' || clerkRole === 'staff') {
                console.log(`[Admin Login] Clerk role이 ${clerkRole}임. 프로필 자동 생성 시도...`)
                
                // 프로필 생성 시도
                const createResponse = await fetch('/api/profile/create', {
                  method: 'POST',
                })
                
                if (createResponse.ok) {
                  const createData = await createResponse.json()
                  
                  // 프로필 생성 후 세션 설정 시도 (admin 또는 staff role 확인)
                  if (createData.profile?.role === 'admin' || createData.profile?.role === 'staff') {
                    const retryResponse = await fetch('/api/admin/session', {
                      method: 'POST',
                    })
                    
                    if (retryResponse.ok) {
                      router.push(redirectUrl)
                      return
                    }
                  }
                } else {
                  console.error('[Admin Login] 프로필 생성 실패:', await createResponse.json())
                }
              } else {
                console.log('[Admin Login] Clerk role이 admin 또는 staff가 아님. 프로필 생성하지 않음.')
                setError("Clerk에서 관리자 권한이 설정되지 않았습니다. Clerk 대시보드에서 사용자의 role을 'admin' 또는 'staff'로 설정해주세요.")
              }
            }
            
            setError(data.error || "관리자 권한이 없습니다. 관리자 계정으로 로그인해주세요.")
            setIsCheckingSession(false)
          }
        })
        .catch((error) => {
          console.error('세션 설정 중 오류:', error)
          setError('세션 설정 중 오류가 발생했습니다.')
          setIsCheckingSession(false)
        })
    } else {
      setIsCheckingSession(false)
    }
  }, [user, userLoaded, router, redirectUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!isLoaded || !signIn) {
      setError("로그인 시스템을 초기화하는 중입니다. 잠시 후 다시 시도해주세요.")
      setIsLoading(false)
      return
    }

    // 이미 로그인된 상태라면 로그인 시도하지 않음
    if (user) {
      // 관리자 세션 쿠키만 설정
      const sessionResponse = await fetch('/api/admin/session', {
        method: 'POST',
      })

      if (sessionResponse.ok) {
        router.push(redirectUrl)
      } else {
        const data = await sessionResponse.json()
        setError(data.error || "관리자 권한이 없습니다. 관리자 계정으로 로그인해주세요.")
        setIsLoading(false)
      }
      return
    }

    try {
      // Clerk 로그인 시도
      const result = await signIn.create({
        identifier: email,
        password: password,
      })

      if (result.status === "complete") {
        // 세션 활성화
        await setActive({ session: result.createdSessionId })
        
        // 관리자 세션 쿠키 설정
        const sessionResponse = await fetch('/api/admin/session', {
          method: 'POST',
        })

        if (sessionResponse.ok) {
          // 세션 설정 성공 시 리다이렉트
          router.push(redirectUrl)
        } else {
          const data = await sessionResponse.json()
          setError(data.error || "관리자 권한이 없습니다. 관리자 계정으로 로그인해주세요.")
          setIsLoading(false)
        }
      } else {
        setError("로그인 처리 중 오류가 발생했습니다.")
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error("로그인 실패:", err)
      
      // "Session already exists" 에러는 무시하고 관리자 세션만 설정
      if (err.errors?.[0]?.message?.includes("already signed in") || 
          err.errors?.[0]?.message?.includes("Session already exists")) {
        // 이미 로그인된 상태이므로 관리자 세션만 설정
        const sessionResponse = await fetch('/api/admin/session', {
          method: 'POST',
        })

        if (sessionResponse.ok) {
          router.push(redirectUrl)
        } else {
          const data = await sessionResponse.json()
          setError(data.error || "관리자 권한이 없습니다. 관리자 계정으로 로그인해주세요.")
          setIsLoading(false)
        }
      } else {
        setError(
          err.errors?.[0]?.message || 
          "이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요."
        )
        setIsLoading(false)
      }
    }
  }

  // 세션 확인 중이면 로딩 표시
  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">관리자 세션을 확인하는 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">관리자 로그인</CardTitle>
          <CardDescription>
            관리자 권한이 있는 계정으로 로그인해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

