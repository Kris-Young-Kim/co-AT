# 🚀 Next.js 16 App Router 가이드

> **Co-AT 프로젝트 Next.js 16 App Router 개발 가이드**  
> Next.js 16의 주요 변경사항과 모범 사례

---

## 📚 목차

1. [Next.js 16 주요 변경사항](#nextjs-16-주요-변경사항)
2. [App Router 핵심 개념](#app-router-핵심-개념)
3. [Server Components vs Client Components](#server-components-vs-client-components)
4. [데이터 페칭 패턴](#데이터-페칭-패턴)
5. [Server Actions](#server-actions)
6. [라우팅 및 네비게이션](#라우팅-및-네비게이션)
7. [성능 최적화](#성능-최적화)
8. [마이그레이션 체크리스트](#마이그레이션-체크리스트)

---

## Next.js 16 주요 변경사항

### ✅ 현재 프로젝트 상태

- **Next.js 버전**: `16.1.1` ✅
- **React 버전**: `19.0.0` ✅
- **App Router**: 사용 중 ✅

### 🆕 Next.js 16의 주요 개선사항

#### 1. **React 19 지원**

- React 19의 새로운 기능 활용 가능
- Server Components 성능 향상
- 자동 배치(Automatic Batching) 개선

#### 2. **향상된 캐싱 전략**

- 더 세밀한 캐시 제어
- `unstable_cache` API 개선
- 부분 프리렌더링(Partial Prerendering) 실험적 지원

#### 3. **성능 개선**

- 빌드 시간 단축
- 번들 크기 최적화
- 런타임 성능 향상

#### 4. **개발자 경험 개선**

- 더 나은 에러 메시지
- 향상된 타입스크립트 지원
- 디버깅 도구 개선

---

## App Router 핵심 개념

### 파일 시스템 기반 라우팅

Next.js 16 App Router는 파일 시스템을 기반으로 라우팅을 구성합니다.

```
app/
├── layout.tsx          # Root Layout
├── page.tsx            # Home Page (/)
├── (public)/           # Route Group (URL에 포함되지 않음)
│   ├── layout.tsx      # Public Layout
│   ├── page.tsx        # Public Home (/)
│   └── services/       # Services Page (/services)
│       └── page.tsx
├── (admin)/            # Route Group
│   ├── layout.tsx      # Admin Layout
│   └── dashboard/      # Dashboard Page (/dashboard)
│       └── page.tsx
└── api/                # API Routes
    └── health/
        └── route.ts
```

### Route Groups

괄호로 묶인 폴더는 URL 경로에 포함되지 않지만, 레이아웃을 공유하는 데 유용합니다.

**예시**:
- `(public)/page.tsx` → `/`
- `(admin)/dashboard/page.tsx` → `/dashboard`

### 동적 라우팅

```
app/
├── clients/
│   └── [id]/
│       └── page.tsx    # /clients/[id]
└── notices/
    └── [id]/
        └── page.tsx    # /notices/[id]
```

### 병렬 라우팅 (Parallel Routes)

같은 레이아웃 내에서 여러 페이지를 동시에 렌더링할 수 있습니다.

```
app/
└── dashboard/
    ├── @analytics/
    │   └── page.tsx
    ├── @team/
    │   └── page.tsx
    └── layout.tsx
```

---

## Server Components vs Client Components

### Server Components (기본값)

**특징**:
- 서버에서만 실행됨
- 번들 크기에 포함되지 않음
- 데이터베이스, 파일 시스템 등 직접 접근 가능
- 브라우저 API 사용 불가

**사용 시기**:
- 데이터 페칭
- 백엔드 리소스 접근
- 민감한 정보 처리
- 큰 의존성 사용

**예시**:
```typescript
// app/clients/page.tsx (Server Component)
import { searchClients } from "@/actions/client-actions"

export default async function ClientsPage() {
  // 서버에서 직접 데이터 페칭
  const result = await searchClients({ limit: 20 })
  const clients = result.success ? result.clients || [] : []

  return (
    <div>
      <h1>대상자 목록</h1>
      {/* ... */}
    </div>
  )
}
```

### Client Components

**특징**:
- 브라우저에서 실행됨
- 인터랙티브 기능 사용 가능
- React Hooks 사용 가능
- 브라우저 API 사용 가능

**사용 시기**:
- 이벤트 핸들러 (onClick, onChange 등)
- 상태 관리 (useState, useEffect 등)
- 브라우저 API (localStorage, window 등)
- React Context 사용

**예시**:
```typescript
// components/features/crm/ClientTable.tsx
"use client"

import { useState } from "react"

export function ClientTable({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState(initialClients)

  return (
    <div>
      {/* 인터랙티브 UI */}
    </div>
  )
}
```

### 하이브리드 패턴 (권장)

Server Component에서 데이터를 페칭하고, Client Component에 props로 전달합니다.

```typescript
// app/clients/page.tsx (Server Component)
import { searchClients } from "@/actions/client-actions"
import { ClientTable } from "@/components/features/crm/ClientTable"

export default async function ClientsPage() {
  // 서버에서 데이터 페칭
  const result = await searchClients({ limit: 20 })
  const initialClients = result.success ? result.clients || [] : []

  // Client Component에 props로 전달
  return <ClientTable initialClients={initialClients} />
}
```

---

## 데이터 페칭 패턴

### 1. Server Component에서 직접 페칭 (권장)

```typescript
// app/services/page.tsx
import { getServices } from "@/actions/service-actions"

export default async function ServicesPage() {
  const services = await getServices()
  
  return (
    <div>
      {services.map(service => (
        <div key={service.id}>{service.name}</div>
      ))}
    </div>
  )
}
```

### 2. Server Actions 사용

```typescript
// actions/service-actions.ts
"use server"

import { createClient } from "@/lib/supabase/server"

export async function getServices() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("services")
    .select("*")
  
  if (error) throw error
  return data
}
```

### 3. React Query와 함께 사용 (Client Component)

```typescript
// components/features/services/ServiceList.tsx
"use client"

import { useQuery } from "@tanstack/react-query"
import { getServices } from "@/actions/service-actions"

export function ServiceList() {
  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  })

  if (isLoading) return <div>로딩 중...</div>

  return (
    <div>
      {services?.map(service => (
        <div key={service.id}>{service.name}</div>
      ))}
    </div>
  )
}
```

---

## Server Actions

### 기본 사용법

```typescript
// actions/client-actions.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createClient(input: CreateClientInput) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("clients")
    .insert(input)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // 캐시 무효화
  revalidatePath("/admin/clients")
  
  return { success: true, data }
}
```

### Client Component에서 사용

```typescript
// components/features/crm/ClientForm.tsx
"use client"

import { createClient } from "@/actions/client-actions"
import { useRouter } from "next/navigation"

export function ClientForm() {
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    const result = await createClient({
      name: formData.get("name") as string,
      // ...
    })

    if (result.success) {
      router.push("/admin/clients")
    }
  }

  return (
    <form action={handleSubmit}>
      {/* ... */}
    </form>
  )
}
```

### 폼과 함께 사용 (권장)

```typescript
// Server Action을 직접 form action으로 사용
<form action={createClient}>
  <input name="name" />
  <button type="submit">제출</button>
</form>
```

---

## 라우팅 및 네비게이션

### useRouter (Client Component)

```typescript
"use client"

import { useRouter } from "next/navigation"

export function NavigationButton() {
  const router = useRouter()

  return (
    <button onClick={() => router.push("/dashboard")}>
      대시보드로 이동
    </button>
  )
}
```

### Link 컴포넌트

```typescript
import Link from "next/link"

export function Navigation() {
  return (
    <nav>
      <Link href="/">홈</Link>
      <Link href="/services">서비스</Link>
      <Link href="/admin/dashboard">대시보드</Link>
    </nav>
  )
}
```

### 동적 라우팅

```typescript
// app/clients/[id]/page.tsx
export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next.js 16: params는 Promise입니다
  const { id } = await params
  
  const client = await getClient(id)
  
  return <div>{client.name}</div>
}
```

### 리다이렉션

```typescript
// app/admin/page.tsx
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const hasPermission = await hasAdminOrStaffPermission()
  
  if (!hasPermission) {
    redirect("/")
  }
  
  return <div>관리자 페이지</div>
}
```

---

## 성능 최적화

### 1. 동적 임포트 (Code Splitting)

```typescript
import dynamic from "next/dynamic"

const HeavyComponent = dynamic(
  () => import("@/components/features/HeavyComponent"),
  {
    loading: () => <div>로딩 중...</div>,
    ssr: true, // 서버 사이드 렌더링 활성화
  }
)
```

### 2. 이미지 최적화

```typescript
import Image from "next/image"

export function OptimizedImage() {
  return (
    <Image
      src="/images/hero.jpg"
      alt="Hero Image"
      width={1920}
      height={1080}
      priority // LCP 이미지에 사용
      placeholder="blur" // 블러 플레이스홀더
    />
  )
}
```

### 3. 메타데이터 최적화

```typescript
// app/services/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "서비스 안내 | GWATC",
  description: "보조기기센터에서 제공하는 다양한 서비스를 확인하세요",
}

export default function ServicesPage() {
  return <div>서비스 페이지</div>
}
```

### 4. 캐싱 전략

```typescript
// actions/notice-actions.ts
import { unstable_cache } from "next/cache"

export async function getNotices() {
  return unstable_cache(
    async () => {
      const supabase = createClient()
      const { data } = await supabase.from("notices").select("*")
      return data
    },
    ["notices"], // 캐시 키
    {
      revalidate: 3600, // 1시간마다 재검증
      tags: ["notices"], // 태그 기반 무효화
    }
  )()
}
```

---

## 마이그레이션 체크리스트

### ✅ Next.js 15 → 16 마이그레이션 완료 항목

- [x] Next.js 16.1.1 설치
- [x] React 19 업그레이드
- [x] `params`를 Promise로 처리 (Next.js 16 요구사항)
- [x] App Router 구조 유지
- [x] Server Components 기본 사용
- [x] Client Components에 `"use client"` 지시어 추가

### 📋 추가 확인 사항

- [ ] 모든 동적 라우트에서 `params`를 `await` 처리
- [ ] Server Actions에서 `revalidatePath` 적절히 사용
- [ ] 이미지 최적화 적용 (`next/image` 사용)
- [ ] 메타데이터 각 페이지에 추가
- [ ] 에러 바운더리 구현 (`error.tsx`)
- [ ] 로딩 상태 처리 (`loading.tsx`)

### 🔍 코드 검토 포인트

#### 1. params 처리 (Next.js 16 필수)

```typescript
// ❌ Next.js 15 방식 (더 이상 작동하지 않음)
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>
}

// ✅ Next.js 16 방식
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <div>{id}</div>
}
```

#### 2. searchParams 처리

```typescript
// ✅ Next.js 16 방식
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { page } = await searchParams
  return <div>Page: {page}</div>
}
```

---

## 모범 사례

### 1. 컴포넌트 구조

```
components/
├── features/          # 기능별 컴포넌트
│   ├── crm/
│   │   ├── ClientTable.tsx      # Client Component
│   │   └── ClientForm.tsx       # Client Component
│   └── dashboard/
│       └── StatsCard.tsx        # Server Component 가능
├── ui/                # 재사용 가능한 UI 컴포넌트
│   ├── button.tsx
│   └── card.tsx
└── layout/            # 레이아웃 컴포넌트
    ├── header.tsx
    └── footer.tsx
```

### 2. 데이터 페칭 패턴

```typescript
// ✅ 권장: Server Component에서 초기 데이터 로드
// app/clients/page.tsx
export default async function ClientsPage() {
  const initialClients = await getClients()
  return <ClientTable initialClients={initialClients} />
}

// ✅ 권장: Client Component에서 추가 데이터 페칭 (React Query)
// components/features/crm/ClientTable.tsx
"use client"
export function ClientTable({ initialClients }) {
  const { data } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
    initialData: initialClients, // Server Component 데이터 사용
  })
  // ...
}
```

### 3. 에러 처리

```typescript
// app/clients/error.tsx
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>오류가 발생했습니다</h2>
      <button onClick={reset}>다시 시도</button>
    </div>
  )
}
```

### 4. 로딩 상태

```typescript
// app/clients/loading.tsx
export default function Loading() {
  return <div>로딩 중...</div>
}
```

---

## 참고 자료

- [Next.js 16 공식 문서](https://nextjs.org/docs)
- [App Router 문서](https://nextjs.org/docs/app)
- [Server Components 문서](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Server Actions 문서](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

**마지막 업데이트**: 2025. 01. 27
