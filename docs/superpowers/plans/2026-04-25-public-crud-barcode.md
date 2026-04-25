# Public CRUD + Barcode Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개 페이지(공지사항/갤러리/사례/지원사업/자료실)에 staff+ 인라인 CRUD UI를 추가하고, 자료실을 DB로 전환하며, 보유 보조기기 바코드 관리 시스템을 구축한다.

**Architecture:**
- Part 1: 기존 `notices` 테이블 + 기존 admin Dialog 컴포넌트 재사용. 서버 컴포넌트에서 권한 체크 후 `isStaff` prop을 클라이언트 컴포넌트에 전달. staff+ 로그인 시 카드에 hover 편집 버튼과 우하단 FAB 노출.
- Part 2: Supabase `resources` 테이블 신규 생성. 영상(YouTube ID 배열)·문서(Supabase Storage URL) 구분. 자료실 페이지 DB 연동으로 전환.
- Part 3: `inventory` 테이블에 `barcode` 컬럼 추가. USB 바코드 스캐너 입력(Enter 키 트리거) → 기기 조회/등록. 공개 페이지는 동일 기종 묶음 → 수량별 재고 현황 카드 표시.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (PostgreSQL + Admin Client), Clerk (auth), shadcn/ui, Tailwind CSS, React Hook Form + Zod, Server Actions

---

## File Map

### Part 1 — 공개 페이지 인라인 CRUD UI (notices 기반)

| 파일 | 역할 |
|---|---|
| `components/features/notices/NoticeListWithCrud.tsx` | **신규** — staff+ 전용 수정/삭제 버튼 + FAB 포함 공개용 목록 |
| `app/(public)/notices/page.tsx` | **수정** — isStaff 체크 후 NoticeListWithCrud 사용 |
| `app/(public)/notices/support/page.tsx` | **수정** — 동일 패턴 적용 |
| `app/(public)/community/gallery/page.tsx` | **수정** — 동일 패턴 적용 |
| `app/(public)/community/cases/page.tsx` | **수정** — 동일 패턴 적용 |

### Part 2 — 자료실 DB 전환 + CRUD

| 파일 | 역할 |
|---|---|
| `migrations/030_create_resources.sql` | **신규** — resources 테이블 생성 |
| `actions/resource-actions.ts` | **신규** — 자료 CRUD Server Actions |
| `components/features/resources/ResourceCreateDialog.tsx` | **신규** — 영상·문서 통합 등록 다이얼로그 |
| `components/features/resources/ResourceEditDialog.tsx` | **신규** — 수정 다이얼로그 |
| `components/features/resources/ResourceListWithCrud.tsx` | **신규** — staff+ CRUD UI 포함 자료 목록 |
| `app/(public)/info/resources/ResourcesClient.tsx` | **수정** — DB 데이터 + isStaff prop 사용으로 교체 |
| `app/(public)/info/resources/page.tsx` | **수정** — DB fetch + isStaff 전달 |
| `app/(public)/info/resources/video/[id]/page.tsx` | **수정** — 하드코딩 제거, DB UUID 기반 동적 라우트 |

### Part 3 — 보유 보조기기 바코드 관리

| 파일 | 역할 |
|---|---|
| `migrations/031_add_barcode_to_inventory.sql` | **신규** — barcode 컬럼 추가 |
| `actions/inventory-actions.ts` | **수정** — getGroupedInventoryForPublic, getInventoryItemByBarcode 추가 |
| `components/features/inventory/BarcodeScanInput.tsx` | **신규** — USB 스캐너 입력 컴포넌트 |
| `components/features/inventory/GroupedDeviceCard.tsx` | **신규** — 기종별 수량 현황 카드 |
| `components/features/inventory/PublicDeviceList.tsx` | **수정** — 그룹 조회 + GroupedDeviceCard 사용 |
| `components/features/inventory/InventoryFormDialog.tsx` | **수정** — barcode 필드 추가 |
| `components/features/inventory/InventoryManagementContent.tsx` | **수정** — 바코드 스캔 플로우 추가 |

---

## PART 1: 공개 페이지 인라인 CRUD UI

### Task 1-1: NoticeListWithCrud 컴포넌트 생성

**Files:**
- Create: `components/features/notices/NoticeListWithCrud.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// components/features/notices/NoticeListWithCrud.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { Pin, Calendar, Pencil, Trash2, Plus } from "lucide-react"
import { type Notice, deleteNotice } from "@/actions/notice-actions"
import { NoticeEditDialog } from "@/components/features/admin/notices/NoticeEditDialog"
import { NoticeCreateDialog } from "@/components/features/admin/notices/NoticeCreateDialog"
import { useRouter } from "next/navigation"

interface NoticeListWithCrudProps {
  notices: Notice[]
  isStaff: boolean
  emptyMessage?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  notice: "공지사항",
  activity: "활동 소식",
  support: "지원사업",
  case: "서비스 사례",
}

export function NoticeListWithCrud({
  notices: initialNotices,
  isStaff,
  emptyMessage = "등록된 공지사항이 없습니다",
}: NoticeListWithCrudProps) {
  const router = useRouter()
  const [notices, setNotices] = useState<Notice[]>(initialNotices)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("정말로 삭제하시겠습니까?")) return
    setDeletingId(id)
    try {
      const result = await deleteNotice(id)
      if (result.success) {
        setNotices((prev) => prev.filter((n) => n.id !== id))
        router.refresh()
      } else {
        alert(result.error || "삭제에 실패했습니다")
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {notices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div key={notice.id} className="relative group">
              <Link href={`/notices/${notice.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {notice.is_pinned && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <Pin className="h-3 w-3" />
                              고정
                            </Badge>
                          )}
                          {notice.category && (
                            <Badge variant="outline" className="text-xs">
                              {CATEGORY_LABELS[notice.category] ?? notice.category}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base sm:text-lg text-foreground line-clamp-2">
                          {notice.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(notice.created_at), "yyyy.MM.dd", { locale: ko })}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-3">
                      {typeof notice.content === "string"
                        ? notice.content.replace(/<[^>]*>/g, "").substring(0, 200)
                        : notice.content}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* staff 전용 편집 버튼 — Link 바깥에 absolute 배치 */}
              {isStaff && (
                <div
                  className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => e.preventDefault()}
                >
                  <NoticeEditDialog notice={notice}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 bg-background"
                      title="수정"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </NoticeEditDialog>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 bg-background text-destructive hover:text-destructive"
                    onClick={(e) => handleDelete(e, notice.id)}
                    disabled={deletingId === notice.id}
                    title="삭제"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 새 글 작성 FAB */}
      {isStaff && (
        <div className="fixed bottom-8 right-8 z-50">
          <NoticeCreateDialog>
            <Button
              size="lg"
              className="rounded-full shadow-lg h-14 w-14 p-0"
              title="새 글 작성"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </NoticeCreateDialog>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: 빌드 오류 없는지 확인**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
pnpm tsc --noEmit 2>&1 | head -30
```

Expected: 오류 없음 (또는 기존에 있던 오류만)

- [ ] **Step 3: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add components/features/notices/NoticeListWithCrud.tsx
git commit -m "feat: add NoticeListWithCrud component with staff inline CRUD controls"
```

---

### Task 1-2: 공개 페이지 4곳 업데이트

**Files:**
- Modify: `app/(public)/notices/page.tsx`
- Modify: `app/(public)/notices/support/page.tsx`
- Modify: `app/(public)/community/gallery/page.tsx`
- Modify: `app/(public)/community/cases/page.tsx`

- [ ] **Step 1: /notices/page.tsx 수정**

```tsx
// app/(public)/notices/page.tsx
import type { Metadata } from "next"
import { getNoticesByCategory } from "@/actions/notice-actions"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { NoticeListWithCrud } from "@/components/features/notices/NoticeListWithCrud"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "공지사항",
  description: "강원특별자치도 보조기기센터의 공지사항을 확인하실 수 있습니다.",
  openGraph: {
    title: "공지사항 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터의 공지사항을 확인하실 수 있습니다.",
    url: `${baseUrl}/notices`,
    type: "website",
  },
  alternates: { canonical: `${baseUrl}/notices` },
}

export default async function NoticesPage() {
  const [notices, isStaff] = await Promise.all([
    getNoticesByCategory("notice", 50),
    hasAdminOrStaffPermission(),
  ])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb items={[{ label: "공지사항", href: "/notices" }]} className="mb-6" />
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">공지사항</h1>
        <p className="text-muted-foreground">센터의 주요 공지사항을 확인하실 수 있습니다</p>
      </div>
      <NoticeListWithCrud notices={notices} isStaff={isStaff} emptyMessage="등록된 공지사항이 없습니다" />
    </div>
  )
}
```

- [ ] **Step 2: /notices/support/page.tsx 수정**

```tsx
// app/(public)/notices/support/page.tsx
import type { Metadata } from "next"
import { getNoticesByCategory } from "@/actions/notice-actions"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { NoticeListWithCrud } from "@/components/features/notices/NoticeListWithCrud"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "지원사업",
  description: "강원특별자치도 보조기기센터의 지원사업 정보를 확인하실 수 있습니다.",
  openGraph: {
    title: "지원사업 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터의 지원사업 정보를 확인하실 수 있습니다.",
    url: `${baseUrl}/notices/support`,
    type: "website",
  },
  alternates: { canonical: `${baseUrl}/notices/support` },
}

export default async function SupportPage() {
  const [notices, isStaff] = await Promise.all([
    getNoticesByCategory("support", 50),
    hasAdminOrStaffPermission(),
  ])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "공지사항", href: "/notices" },
          { label: "지원사업", href: "/notices/support" },
        ]}
        className="mb-6"
      />
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">지원사업</h1>
        <p className="text-muted-foreground">센터의 지원사업 정보를 확인하실 수 있습니다</p>
      </div>
      <NoticeListWithCrud notices={notices} isStaff={isStaff} emptyMessage="등록된 지원사업이 없습니다" />
    </div>
  )
}
```

- [ ] **Step 3: /community/gallery/page.tsx 수정**

```tsx
// app/(public)/community/gallery/page.tsx
import type { Metadata } from "next"
import { getNoticesByCategory } from "@/actions/notice-actions"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { NoticeListWithCrud } from "@/components/features/notices/NoticeListWithCrud"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "활동갤러리",
  description: "강원특별자치도 보조기기센터의 다양한 활동 소식을 확인하세요. 교육, 홍보, 서비스 제공 활동을 만나보세요.",
  openGraph: {
    title: "활동갤러리 | GWATC 보조기기센터",
    description: "강원특별자치도 보조기기센터의 다양한 활동 소식을 확인하세요.",
    url: `${baseUrl}/community/gallery`,
    type: "website",
  },
  alternates: { canonical: `${baseUrl}/community/gallery` },
}

export default async function GalleryPage() {
  const [notices, isStaff] = await Promise.all([
    getNoticesByCategory("activity", 50),
    hasAdminOrStaffPermission(),
  ])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "커뮤니티", href: "/community" },
          { label: "활동갤러리", href: "/community/gallery" },
        ]}
        className="mb-6"
      />
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">활동갤러리</h1>
        <p className="text-muted-foreground">센터의 다양한 활동 소식을 확인하실 수 있습니다</p>
      </div>
      <NoticeListWithCrud notices={notices} isStaff={isStaff} emptyMessage="등록된 활동 소식이 없습니다" />
    </div>
  )
}
```

- [ ] **Step 4: /community/cases/page.tsx 수정**

```tsx
// app/(public)/community/cases/page.tsx
import type { Metadata } from "next"
import { getNoticesByCategory } from "@/actions/notice-actions"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { NoticeListWithCrud } from "@/components/features/notices/NoticeListWithCrud"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "보조기기 서비스 사례",
  description: "실제 보조기기 서비스 사례를 확인하세요. 다양한 상황에서의 보조기기 활용 사례를 공유합니다.",
  openGraph: {
    title: "보조기기 서비스 사례 | GWATC 보조기기센터",
    description: "실제 보조기기 서비스 사례를 확인하세요.",
    url: `${baseUrl}/community/cases`,
    type: "website",
  },
  alternates: { canonical: `${baseUrl}/community/cases` },
}

export default async function CasesPage() {
  const [notices, isStaff] = await Promise.all([
    getNoticesByCategory("case", 50),
    hasAdminOrStaffPermission(),
  ])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "커뮤니티", href: "/community" },
          { label: "보조기기 서비스 사례", href: "/community/cases" },
        ]}
        className="mb-6"
      />
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">보조기기 서비스 사례</h1>
        <p className="text-muted-foreground">실제 보조기기 서비스 사례를 확인하실 수 있습니다</p>
      </div>
      <NoticeListWithCrud notices={notices} isStaff={isStaff} emptyMessage="등록된 서비스 사례가 없습니다" />
    </div>
  )
}
```

- [ ] **Step 5: 빌드 확인**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
pnpm tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add app/(public)/notices/page.tsx \
        app/(public)/notices/support/page.tsx \
        app/(public)/community/gallery/page.tsx \
        app/(public)/community/cases/page.tsx
git commit -m "feat: add inline CRUD controls to 4 public notice pages for staff+ users"
```

---

## PART 2: 자료실 DB 전환 + CRUD

### Task 2-1: DB 마이그레이션 — resources 테이블 생성

**Files:**
- Create: `migrations/030_create_resources.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- migrations/030_create_resources.sql
-- resources 테이블: 영상자료(video)와 문서자료(document)를 하나의 테이블로 관리

CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('document', 'video')),
  title TEXT NOT NULL,
  description TEXT,
  -- 문서자료 전용
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  -- 영상자료 전용 (YouTube ID 배열)
  youtube_ids TEXT[],
  -- 공통
  resource_date DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 조회 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
```

- [ ] **Step 2: Supabase 대시보드에서 SQL 실행**

Supabase 대시보드 → SQL Editor → 위 SQL 붙여넣기 → Run

실행 후 확인:
```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'resources' ORDER BY ordinal_position;
```

Expected: id, type, title, description, file_url, file_name, file_size, youtube_ids, resource_date, created_by, created_at, updated_at 컬럼 존재

- [ ] **Step 3: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add migrations/030_create_resources.sql
git commit -m "feat: add resources table migration for DB-backed document and video resources"
```

---

### Task 2-2: resource-actions.ts Server Actions 생성

**Files:**
- Create: `actions/resource-actions.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// actions/resource-actions.ts
"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission, getCurrentUserProfileId } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export interface Resource {
  id: string
  type: "document" | "video"
  title: string
  description: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  youtube_ids: string[] | null
  resource_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateResourceInput {
  type: "document" | "video"
  title: string
  description?: string
  file_url?: string
  file_name?: string
  file_size?: number
  youtube_ids?: string[]
  resource_date?: string
}

export interface UpdateResourceInput {
  id: string
  title?: string
  description?: string
  file_url?: string
  file_name?: string
  file_size?: number
  youtube_ids?: string[]
  resource_date?: string
}

export async function getResources(type?: "document" | "video"): Promise<Resource[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from("resources")
    .select("*")
    .order("resource_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (type) {
    query = query.eq("type", type)
  }

  const { data, error } = await query

  if (error) {
    console.error("[Resource Actions] 자료 조회 실패:", error)
    return []
  }

  return (data || []) as Resource[]
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("[Resource Actions] 자료 상세 조회 실패:", error)
    return null
  }

  return data as Resource
}

export async function createResource(
  input: CreateResourceInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const profileId = await getCurrentUserProfileId()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("resources")
    .insert({ ...input, created_by: profileId })
    .select("id")
    .single()

  if (error) {
    console.error("[Resource Actions] 자료 생성 실패:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/info/resources")
  return { success: true, id: (data as { id: string }).id }
}

export async function updateResource(
  input: UpdateResourceInput
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const { id, ...updateData } = input
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("resources")
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("[Resource Actions] 자료 수정 실패:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/info/resources")
  return { success: true }
}

export async function deleteResource(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()

  const { error } = await supabase.from("resources").delete().eq("id", id)

  if (error) {
    console.error("[Resource Actions] 자료 삭제 실패:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/info/resources")
  return { success: true }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
pnpm tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add actions/resource-actions.ts
git commit -m "feat: add resource-actions server actions for document and video CRUD"
```

---

### Task 2-3: ResourceCreateDialog 컴포넌트 생성

**Files:**
- Create: `components/features/resources/ResourceCreateDialog.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// components/features/resources/ResourceCreateDialog.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createResource, type CreateResourceInput } from "@/actions/resource-actions"
import type { ReactNode } from "react"

interface ResourceCreateDialogProps {
  children: ReactNode
}

export function ResourceCreateDialog({ children }: ResourceCreateDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [type, setType] = useState<"video" | "document">("video")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [resourceDate, setResourceDate] = useState("")
  // 영상자료 전용
  const [youtubeIdsRaw, setYoutubeIdsRaw] = useState("")
  // 문서자료 전용
  const [fileUrl, setFileUrl] = useState("")
  const [fileName, setFileName] = useState("")

  const resetForm = () => {
    setType("video")
    setTitle("")
    setDescription("")
    setResourceDate("")
    setYoutubeIdsRaw("")
    setFileUrl("")
    setFileName("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { alert("제목을 입력해주세요"); return }

    setIsSubmitting(true)
    try {
      const input: CreateResourceInput = {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        resource_date: resourceDate || undefined,
      }

      if (type === "video") {
        // 쉼표·줄바꿈으로 구분된 YouTube ID 파싱
        const ids = youtubeIdsRaw
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
        if (ids.length === 0) { alert("YouTube ID를 입력해주세요"); return }
        input.youtube_ids = ids
      } else {
        if (!fileUrl.trim()) { alert("파일 URL을 입력해주세요"); return }
        input.file_url = fileUrl.trim()
        input.file_name = fileName.trim() || undefined
      }

      const result = await createResource(input)
      if (result.success) {
        resetForm()
        setOpen(false)
        router.refresh()
      } else {
        alert(result.error || "등록에 실패했습니다")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>자료 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>자료 유형 *</Label>
            <Select value={type} onValueChange={(v) => setType(v as "video" | "document")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">영상자료</SelectItem>
                <SelectItem value="document">문서자료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-title">제목 *</Label>
            <Input
              id="res-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="자료 제목을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-desc">설명</Label>
            <Textarea
              id="res-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="자료에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-date">자료 날짜</Label>
            <Input
              id="res-date"
              type="date"
              value={resourceDate}
              onChange={(e) => setResourceDate(e.target.value)}
            />
          </div>

          {type === "video" && (
            <div className="space-y-2">
              <Label htmlFor="res-youtube">YouTube ID *</Label>
              <Textarea
                id="res-youtube"
                value={youtubeIdsRaw}
                onChange={(e) => setYoutubeIdsRaw(e.target.value)}
                placeholder={"YouTube 영상 ID를 입력하세요\n여러 개는 쉼표 또는 줄바꿈으로 구분\n예: dQw4w9WgXcQ"}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                YouTube URL에서 v= 뒤의 ID만 입력하세요
              </p>
            </div>
          )}

          {type === "document" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="res-file-url">파일 URL *</Label>
                <Input
                  id="res-file-url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Supabase Storage 또는 외부 URL
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="res-file-name">파일명</Label>
                <Input
                  id="res-file-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="예: 2025_보조기기_안내서.pdf"
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { resetForm(); setOpen(false) }} disabled={isSubmitting}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add components/features/resources/ResourceCreateDialog.tsx
git commit -m "feat: add ResourceCreateDialog for video and document resource registration"
```

---

### Task 2-4: ResourceEditDialog 컴포넌트 생성

**Files:**
- Create: `components/features/resources/ResourceEditDialog.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// components/features/resources/ResourceEditDialog.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateResource, type Resource } from "@/actions/resource-actions"
import type { ReactNode } from "react"

interface ResourceEditDialogProps {
  resource: Resource
  children: ReactNode
}

export function ResourceEditDialog({ resource, children }: ResourceEditDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(resource.title)
  const [description, setDescription] = useState(resource.description || "")
  const [resourceDate, setResourceDate] = useState(resource.resource_date || "")
  const [youtubeIdsRaw, setYoutubeIdsRaw] = useState(
    (resource.youtube_ids || []).join("\n")
  )
  const [fileUrl, setFileUrl] = useState(resource.file_url || "")
  const [fileName, setFileName] = useState(resource.file_name || "")

  useEffect(() => {
    if (open) {
      setTitle(resource.title)
      setDescription(resource.description || "")
      setResourceDate(resource.resource_date || "")
      setYoutubeIdsRaw((resource.youtube_ids || []).join("\n"))
      setFileUrl(resource.file_url || "")
      setFileName(resource.file_name || "")
    }
  }, [open, resource])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { alert("제목을 입력해주세요"); return }

    setIsSubmitting(true)
    try {
      const updateData: Parameters<typeof updateResource>[0] = {
        id: resource.id,
        title: title.trim(),
        description: description.trim() || undefined,
        resource_date: resourceDate || undefined,
      }

      if (resource.type === "video") {
        const ids = youtubeIdsRaw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
        if (ids.length === 0) { alert("YouTube ID를 입력해주세요"); return }
        updateData.youtube_ids = ids
      } else {
        if (!fileUrl.trim()) { alert("파일 URL을 입력해주세요"); return }
        updateData.file_url = fileUrl.trim()
        updateData.file_name = fileName.trim() || undefined
      }

      const result = await updateResource(updateData)
      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        alert(result.error || "수정에 실패했습니다")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resource.type === "video" ? "영상자료" : "문서자료"} 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-res-title">제목 *</Label>
            <Input id="edit-res-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-res-desc">설명</Label>
            <Textarea id="edit-res-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-res-date">자료 날짜</Label>
            <Input id="edit-res-date" type="date" value={resourceDate} onChange={(e) => setResourceDate(e.target.value)} />
          </div>

          {resource.type === "video" && (
            <div className="space-y-2">
              <Label htmlFor="edit-res-youtube">YouTube ID *</Label>
              <Textarea
                id="edit-res-youtube"
                value={youtubeIdsRaw}
                onChange={(e) => setYoutubeIdsRaw(e.target.value)}
                rows={3}
                placeholder={"YouTube 영상 ID (여러 개는 줄바꿈으로 구분)"}
              />
            </div>
          )}

          {resource.type === "document" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-res-file-url">파일 URL *</Label>
                <Input id="edit-res-file-url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-res-file-name">파일명</Label>
                <Input id="edit-res-file-name" value={fileName} onChange={(e) => setFileName(e.target.value)} />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>취소</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "수정 중..." : "수정"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add components/features/resources/ResourceEditDialog.tsx
git commit -m "feat: add ResourceEditDialog for editing existing resources"
```

---

### Task 2-5: ResourceListWithCrud 컴포넌트 생성

**Files:**
- Create: `components/features/resources/ResourceListWithCrud.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// components/features/resources/ResourceListWithCrud.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, FileText, Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type Resource, deleteResource } from "@/actions/resource-actions"
import { ResourceCreateDialog } from "./ResourceCreateDialog"
import { ResourceEditDialog } from "./ResourceEditDialog"

interface ResourceListWithCrudProps {
  resources: Resource[]
  isStaff: boolean
}

export function ResourceListWithCrud({ resources: initialResources, isStaff }: ResourceListWithCrudProps) {
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>(initialResources)
  const [tab, setTab] = useState<"video" | "document">("video")
  const [query, setQuery] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = resources.filter(
    (r) =>
      r.type === tab &&
      r.title.replace(/\s/g, "").toLowerCase().includes(query.replace(/\s/g, "").toLowerCase())
  )

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("정말로 삭제하시겠습니까?")) return
    setDeletingId(id)
    try {
      const result = await deleteResource(id)
      if (result.success) {
        setResources((prev) => prev.filter((r) => r.id !== id))
        router.refresh()
      } else {
        alert(result.error || "삭제에 실패했습니다")
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* 탭 */}
      <div className="flex border-b mb-6">
        {(["video", "document"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setQuery("") }}
            className={cn(
              "px-6 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "video" ? "영상자료" : "문서자료"}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력해 주세요"
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">{query ? "검색 결과가 없습니다." : "등록된 자료가 없습니다."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((resource) => (
            <div key={resource.id} className="relative group">
              {resource.type === "video" ? (
                <Link
                  href={`/info/resources/video/${resource.id}`}
                  className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white block"
                >
                  <div className="relative overflow-hidden" style={{ paddingTop: "56.25%" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${resource.youtube_ids?.[0]}/mqdefault.jpg`}
                      alt={resource.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs sm:text-sm font-medium text-foreground leading-snug line-clamp-2 mb-1.5">
                      {resource.title}
                    </p>
                    {resource.resource_date && (
                      <p className="text-xs text-muted-foreground">{resource.resource_date}</p>
                    )}
                  </div>
                </Link>
              ) : (
                <a
                  href={resource.file_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white block"
                >
                  <div
                    className="bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center"
                    style={{ height: "160px" }}
                  >
                    <FileText className="h-12 w-12 text-indigo-300" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs sm:text-sm font-medium text-foreground leading-snug line-clamp-2 mb-1.5">
                      {resource.title}
                    </p>
                    {resource.resource_date && (
                      <p className="text-xs text-muted-foreground">{resource.resource_date}</p>
                    )}
                  </div>
                </a>
              )}

              {/* staff 전용 편집 버튼 */}
              {isStaff && (
                <div
                  className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => e.preventDefault()}
                >
                  <ResourceEditDialog resource={resource}>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 bg-background" title="수정">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </ResourceEditDialog>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 bg-background text-destructive hover:text-destructive"
                    onClick={(e) => handleDelete(e, resource.id)}
                    disabled={deletingId === resource.id}
                    title="삭제"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 새 자료 등록 FAB */}
      {isStaff && (
        <div className="fixed bottom-8 right-8 z-50">
          <ResourceCreateDialog>
            <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0" title="자료 등록">
              <Plus className="h-6 w-6" />
            </Button>
          </ResourceCreateDialog>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add components/features/resources/ResourceListWithCrud.tsx
git commit -m "feat: add ResourceListWithCrud with staff inline edit/delete controls and FAB"
```

---

### Task 2-6: 자료실 페이지 DB 연동 전환

**Files:**
- Modify: `app/(public)/info/resources/page.tsx`
- Modify: `app/(public)/info/resources/ResourcesClient.tsx`
- Modify: `app/(public)/info/resources/video/[id]/page.tsx`

- [ ] **Step 1: resources/page.tsx 수정** — DB fetch + isStaff 전달

```tsx
// app/(public)/info/resources/page.tsx
import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { getResources } from "@/actions/resource-actions"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { ResourceListWithCrud } from "@/components/features/resources/ResourceListWithCrud"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "자료실",
  description: "보조기기 관련 영상자료 및 문서자료를 제공합니다.",
  openGraph: {
    title: "자료실 | GWATC 보조기기센터",
    description: "보조기기 관련 영상자료 및 문서자료를 제공합니다.",
    url: `${baseUrl}/info/resources`,
    type: "website",
  },
  alternates: { canonical: `${baseUrl}/info/resources` },
}

export default async function ResourcesPage() {
  const [resources, isStaff] = await Promise.all([
    getResources(),
    hasAdminOrStaffPermission(),
  ])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "자료실", href: "/info/resources" },
        ]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-8">자료실</h1>
      <ResourceListWithCrud resources={resources} isStaff={isStaff} />
    </div>
  )
}
```

- [ ] **Step 2: ResourcesClient.tsx 제거** — 이제 page.tsx가 직접 ResourceListWithCrud를 사용하므로 파일 삭제

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
rm "app/(public)/info/resources/ResourcesClient.tsx"
```

- [ ] **Step 3: video/[id]/page.tsx 수정** — DB UUID 기반 동적 라우트로 전환

```tsx
// app/(public)/info/resources/video/[id]/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Breadcrumb } from "@/components/common/breadcrumb"
import { ChevronLeft } from "lucide-react"
import { getResourceById } from "@/actions/resource-actions"

// generateStaticParams 제거 — DB 기반 동적 라우트

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const resource = await getResourceById(id)
  if (!resource) return {}
  return { title: resource.title }
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const resource = await getResourceById(id)

  if (!resource || resource.type !== "video") notFound()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "보조기기 정보", href: "/info" },
          { label: "자료실", href: "/info/resources" },
          { label: resource.title, href: `/info/resources/video/${resource.id}` },
        ]}
        className="mb-6"
      />

      <div className="max-w-3xl">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">{resource.title}</h1>
        {resource.resource_date && (
          <p className="text-sm text-muted-foreground mb-8">{resource.resource_date}</p>
        )}

        <div className="space-y-6">
          {(resource.youtube_ids || []).map((ytId, i) => (
            <div key={ytId + i} className="rounded-xl overflow-hidden border bg-black">
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={resource.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          ))}
        </div>

        {resource.description && (
          <p className="mt-6 text-sm text-gray-700 leading-relaxed">{resource.description}</p>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            href="/info/resources"
            className="inline-flex items-center gap-2 px-6 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            목록가기
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 빌드 확인**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
pnpm tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add "app/(public)/info/resources/page.tsx" \
        "app/(public)/info/resources/video/[id]/page.tsx"
git rm "app/(public)/info/resources/ResourcesClient.tsx"
git commit -m "feat: migrate resources page to DB-backed system with staff CRUD controls"
```

---

## PART 3: 보유 보조기기 바코드 관리 시스템

### Task 3-1: DB 마이그레이션 — inventory 테이블 barcode 컬럼 추가

**Files:**
- Create: `migrations/031_add_barcode_to_inventory.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- migrations/031_add_barcode_to_inventory.sql
-- inventory 테이블에 바코드 컬럼 추가 (1D 바코드, qr_code와 별도 관리)

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS barcode TEXT;

-- 바코드 중복 방지 (null 제외)
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_barcode_unique
  ON inventory(barcode) WHERE barcode IS NOT NULL;

-- 바코드 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(barcode);
```

- [ ] **Step 2: Supabase 대시보드에서 SQL 실행**

Supabase 대시보드 → SQL Editor → 위 SQL 실행

확인:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'inventory' AND column_name = 'barcode';
```

Expected: barcode 행 1건 반환

- [ ] **Step 3: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add migrations/031_add_barcode_to_inventory.sql
git commit -m "feat: add barcode column to inventory table with unique index"
```

---

### Task 3-2: inventory-actions.ts 에 신규 함수 추가

**Files:**
- Modify: `actions/inventory-actions.ts`

- [ ] **Step 1: InventoryItem 타입에 barcode 필드 추가** — 파일 상단 인터페이스 수정

기존 `InventoryItem` 인터페이스를 찾아 `barcode` 필드 추가:

```typescript
// actions/inventory-actions.ts 의 InventoryItem 인터페이스에 추가
export interface InventoryItem {
  id: string
  name: string
  asset_code: string | null
  category: string | null
  status: string | null
  is_rental_available: boolean | null
  manufacturer: string | null
  model: string | null
  purchase_date: string | null
  purchase_price: number | null
  qr_code: string | null
  barcode: string | null   // ← 추가
  image_url: string | null
  created_at: string | null
  updated_at: string | null
}
```

- [ ] **Step 2: GroupedDevice 타입 및 getGroupedInventoryForPublic 함수 추가** — 파일 끝에 추가

```typescript
// actions/inventory-actions.ts 끝에 추가

export interface GroupedDevice {
  name: string
  category: string | null
  manufacturer: string | null
  model: string | null
  image_url: string | null
  total: number
  stored: number    // 보관 (대여가능)
  rented: number    // 대여중
  repairing: number // 수리중
  cleaning: number  // 소독중
}

/**
 * 공개 페이지용 — 동일 기종을 묶어 수량별 재고 현황 반환
 * 폐기 항목 제외, 기종별(name + manufacturer + model) 그룹화
 */
export async function getGroupedInventoryForPublic(): Promise<GroupedDevice[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("inventory")
    .select("name, category, manufacturer, model, image_url, status")
    .neq("status", "폐기")
    .order("name")

  if (error) {
    console.error("[Inventory Actions] 그룹 재고 조회 실패:", error)
    return []
  }

  const groupMap = new Map<string, GroupedDevice>()

  for (const item of data || []) {
    const key = `${item.name}__${item.manufacturer ?? ""}__${item.model ?? ""}`

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        name: item.name,
        category: item.category,
        manufacturer: item.manufacturer,
        model: item.model,
        image_url: item.image_url,
        total: 0,
        stored: 0,
        rented: 0,
        repairing: 0,
        cleaning: 0,
      })
    }

    const group = groupMap.get(key)!
    group.total++
    if (item.status === "보관") group.stored++
    else if (item.status === "대여중") group.rented++
    else if (item.status === "수리중") group.repairing++
    else if (item.status === "소독중") group.cleaning++
  }

  return Array.from(groupMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "ko")
  )
}

/**
 * 바코드로 단일 재고 항목 조회 (admin 바코드 스캔용)
 */
export async function getInventoryItemByBarcode(
  barcode: string
): Promise<{ success: boolean; item?: InventoryItem; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle()

  if (error) {
    console.error("[Inventory Actions] 바코드 조회 실패:", error)
    return { success: false, error: error.message }
  }

  return { success: true, item: data as InventoryItem | undefined }
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
pnpm tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add actions/inventory-actions.ts
git commit -m "feat: add GroupedDevice type, getGroupedInventoryForPublic, getInventoryItemByBarcode"
```

---

### Task 3-3: BarcodeScanInput 컴포넌트 생성

**Files:**
- Create: `components/features/inventory/BarcodeScanInput.tsx`

- [ ] **Step 1: 파일 생성**

USB 바코드 스캐너는 빠르게 문자를 입력하고 마지막에 Enter를 보낸다.
이 컴포넌트는 Enter 키 또는 확인 버튼으로 스캔 완료를 처리한다.

```tsx
// components/features/inventory/BarcodeScanInput.tsx
"use client"

import { useRef, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Barcode, X } from "lucide-react"
import { Label } from "@/components/ui/label"

interface BarcodeScanInputProps {
  onScan: (barcode: string) => void
  isLoading?: boolean
  autoFocus?: boolean
}

export function BarcodeScanInput({ onScan, isLoading = false, autoFocus = true }: BarcodeScanInputProps) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const trimmed = value.trim()
      if (trimmed) {
        onScan(trimmed)
        setValue("")
      }
    }
  }

  const handleConfirm = () => {
    const trimmed = value.trim()
    if (trimmed) {
      onScan(trimmed)
      setValue("")
      inputRef.current?.focus()
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Barcode className="h-4 w-4" />
        바코드 스캔 / 입력
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="바코드를 스캔하거나 직접 입력 후 Enter"
            disabled={isLoading}
            className="pr-8"
          />
          {value && (
            <button
              type="button"
              onClick={() => { setValue(""); inputRef.current?.focus() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleConfirm}
          disabled={!value.trim() || isLoading}
        >
          {isLoading ? "조회 중..." : "조회"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        USB/블루투스 바코드 스캐너 연결 후 스캔하거나, 바코드 번호를 직접 입력하세요.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add components/features/inventory/BarcodeScanInput.tsx
git commit -m "feat: add BarcodeScanInput component for USB/BT barcode scanner integration"
```

---

### Task 3-4: InventoryFormDialog — barcode 필드 추가

**Files:**
- Modify: `components/features/inventory/InventoryFormDialog.tsx`

- [ ] **Step 1: formData 초기값에 barcode 추가**

`InventoryFormDialog.tsx`에서 formData state 정의를 찾아 `barcode` 필드 추가:

```typescript
// 기존 formData state (line ~53)
const [formData, setFormData] = useState({
  name: "",
  asset_code: "",
  category: "",
  status: "보관",
  is_rental_available: true,
  manufacturer: "",
  model: "",
  barcode: "",        // ← 추가
  // ... 나머지 기존 필드 유지
})
```

- [ ] **Step 2: item prop으로 초기화 시 barcode 포함**

`useEffect`에서 `item`이 있을 때 formData 초기화하는 부분에 barcode 추가:

```typescript
// item 초기화 useEffect 내부에 barcode 추가
barcode: item?.barcode || "",
```

- [ ] **Step 3: 폼 UI에 barcode 입력 필드 추가**

`asset_code` Input 아래에 barcode 입력 필드 추가:

```tsx
<div className="space-y-2">
  <Label htmlFor="barcode">바코드</Label>
  <Input
    id="barcode"
    value={formData.barcode}
    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
    placeholder="바코드 번호 (스캐너 또는 직접 입력)"
  />
</div>
```

- [ ] **Step 4: submit 시 barcode 포함**

`createInventoryItem` 또는 `updateInventoryItem` 호출 시 barcode 포함:

```typescript
// submit 핸들러에서 전달 데이터에 barcode 추가
barcode: formData.barcode || null,
```

- [ ] **Step 5: 빌드 확인**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
pnpm tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add components/features/inventory/InventoryFormDialog.tsx
git commit -m "feat: add barcode field to InventoryFormDialog"
```

---

### Task 3-5: InventoryManagementContent — 바코드 스캔 플로우 추가

**Files:**
- Modify: `components/features/inventory/InventoryManagementContent.tsx`

- [ ] **Step 1: import 추가**

파일 상단 import에 추가:
```typescript
import { BarcodeScanInput } from "./BarcodeScanInput"
import { getInventoryItemByBarcode } from "@/actions/inventory-actions"
```

- [ ] **Step 2: 바코드 스캔 상태 및 핸들러 추가**

기존 상태 선언부 아래에 추가:
```typescript
const [isBarcodeMode, setIsBarcodeMode] = useState(false)
const [barcodeLoading, setBarcodeLoading] = useState(false)
```

바코드 스캔 핸들러 추가:
```typescript
const handleBarcodeScan = async (barcode: string) => {
  setBarcodeLoading(true)
  try {
    const result = await getInventoryItemByBarcode(barcode)
    if (result.success && result.item) {
      // 기존 기기 조회됨 → 수정 모드로 다이얼로그 열기
      setEditingItem(result.item)
      setIsFormDialogOpen(true)
    } else {
      // 미등록 바코드 → 신규 등록 (barcode 필드 미리 채움)
      // InventoryFormDialog가 barcode를 prop으로 받도록 별도 처리 필요시
      // 현재는 안내 메시지 후 신규 등록 다이얼로그 오픈
      if (confirm(`바코드 "${barcode}" 는 미등록 기기입니다.\n새로 등록하시겠습니까?`)) {
        setEditingItem(null)
        setIsFormDialogOpen(true)
      }
    }
  } finally {
    setBarcodeLoading(false)
  }
}
```

- [ ] **Step 3: 바코드 스캔 버튼 및 UI 추가**

기존 "새 기기 등록" Button 옆에 바코드 버튼 추가:

```tsx
<Button variant="outline" onClick={() => setIsBarcodeMode(!isBarcodeMode)}>
  <Barcode className="h-4 w-4 mr-2" />
  바코드 스캔
</Button>
```

(Barcode 아이콘은 lucide-react에서 import: `import { ..., Barcode } from "lucide-react"`)

바코드 모드 활성화 시 BarcodeScanInput 표시 (통계 대시보드 바로 아래):

```tsx
{isBarcodeMode && (
  <div className="p-4 border rounded-lg bg-muted/30">
    <BarcodeScanInput onScan={handleBarcodeScan} isLoading={barcodeLoading} />
  </div>
)}
```

- [ ] **Step 4: 빌드 확인**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
pnpm tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add components/features/inventory/InventoryManagementContent.tsx
git commit -m "feat: add barcode scan flow to InventoryManagementContent"
```

---

### Task 3-6: GroupedDeviceCard 컴포넌트 생성

**Files:**
- Create: `components/features/inventory/GroupedDeviceCard.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// components/features/inventory/GroupedDeviceCard.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { type GroupedDevice } from "@/actions/inventory-actions"
import Image from "next/image"
import { Package } from "lucide-react"

interface GroupedDeviceCardProps {
  device: GroupedDevice
}

export function GroupedDeviceCard({ device }: GroupedDeviceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* 이미지 */}
      <div className="relative w-full h-48 bg-muted">
        {device.image_url ? (
          <Image
            src={device.image_url}
            alt={device.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* 정보 */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-base mb-1 line-clamp-2">{device.name}</h3>
        {(device.manufacturer || device.model) && (
          <p className="text-xs text-muted-foreground mb-3">
            {[device.manufacturer, device.model].filter(Boolean).join(" ")}
          </p>
        )}

        {/* 재고 현황 */}
        <div className="space-y-1.5 text-sm border-t pt-3">
          <div className="flex justify-between font-medium">
            <span className="text-muted-foreground">총 보유</span>
            <span>{device.total}대</span>
          </div>
          {device.stored > 0 && (
            <div className="flex justify-between">
              <span className="text-green-600">대여가능</span>
              <span className="font-medium text-green-600">{device.stored}대</span>
            </div>
          )}
          {device.rented > 0 && (
            <div className="flex justify-between">
              <span className="text-blue-600">대여중</span>
              <span className="font-medium text-blue-600">{device.rented}대</span>
            </div>
          )}
          {device.repairing > 0 && (
            <div className="flex justify-between">
              <span className="text-yellow-600">수리중</span>
              <span className="font-medium text-yellow-600">{device.repairing}대</span>
            </div>
          )}
          {device.cleaning > 0 && (
            <div className="flex justify-between">
              <span className="text-purple-600">소독중</span>
              <span className="font-medium text-purple-600">{device.cleaning}대</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add components/features/inventory/GroupedDeviceCard.tsx
git commit -m "feat: add GroupedDeviceCard showing per-model inventory counts"
```

---

### Task 3-7: PublicDeviceList — 그룹 조회로 전환

**Files:**
- Modify: `components/features/inventory/PublicDeviceList.tsx`

- [ ] **Step 1: 파일 전체 교체**

```tsx
// components/features/inventory/PublicDeviceList.tsx
"use client"

import { useState, useEffect } from "react"
import { GroupedDeviceCard } from "./GroupedDeviceCard"
import { type GroupedDevice, getGroupedInventoryForPublic } from "@/actions/inventory-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search } from "lucide-react"

export function PublicDeviceList() {
  const [devices, setDevices] = useState<GroupedDevice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState("")

  const loadDevices = async () => {
    setIsLoading(true)
    try {
      const data = await getGroupedInventoryForPublic()
      setDevices(data)
    } catch (error) {
      console.error("[PublicDeviceList] 재고 조회 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
  }, [])

  // 30초마다 실시간 갱신
  useEffect(() => {
    const interval = setInterval(loadDevices, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = devices.filter(
    (d) =>
      d.name.replace(/\s/g, "").toLowerCase().includes(query.replace(/\s/g, "").toLowerCase()) ||
      (d.category ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (d.manufacturer ?? "").toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 검색 + 새로고침 */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기기명, 카테고리, 제조사 검색"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={loadDevices} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "새로고침"}
        </Button>
      </div>

      {/* 목록 */}
      {isLoading && devices.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {query ? "검색 결과가 없습니다." : "등록된 보조기기가 없습니다."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((device, i) => (
            <GroupedDeviceCard key={`${device.name}-${i}`} device={device} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
pnpm tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git add components/features/inventory/PublicDeviceList.tsx
git commit -m "feat: update PublicDeviceList to show grouped device inventory with counts"
```

---

## 최종 검증

- [ ] **개발 서버 실행 및 전체 동작 확인**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
pnpm dev
```

확인 항목:
1. **Part 1** — staff 계정으로 `/notices` 접속 → 카드 hover 시 ✏ 🗑 버튼 노출, 우하단 + FAB 표시
2. **Part 1** — user 계정(또는 비로그인)으로 접속 → 편집 버튼 없음
3. **Part 2** — `/info/resources` 접속 → DB 자료 표시 (초기엔 빈 목록), staff 로그인 시 FAB 표시
4. **Part 2** — 자료 등록 → 영상: YouTube ID 입력 → 영상 카드 표시. 문서: URL 입력 → 문서 카드 표시
5. **Part 2** — `/info/resources/video/{uuid}` 페이지 → YouTube 임베드 정상 표시
6. **Part 3** — `/admin/inventory` → "바코드 스캔" 버튼 클릭 → BarcodeScanInput 표시 → 바코드 입력 → 기기 조회
7. **Part 3** — `/info/devices` 접속 → 기종별 수량 카드 표시 (등록된 기기가 있으면)

- [ ] **최종 Commit**

```bash
cd "D:/AILeader1/project/valuewith/co-AT"
git log --oneline -15
```

---

## 구현 후 메모

- **자료실 기존 하드코딩 데이터** (`lib/data/resources.ts`): 기존 영상/문서 자료를 DB에 수동으로 이관하거나, 관리자가 새로 등록한다. 파일 자체는 삭제하지 않고 유지 (다른 곳에서 참조 여부 확인 후 삭제).
- **바코드 라벨 출력**: 향후 `jsbarcode` 라이브러리로 바코드 이미지를 생성하고 인쇄하는 기능 추가 가능.
- **inventory barcode + createInventoryItem**: `createInventoryItem`, `updateInventoryItem` Server Action에도 barcode 필드가 저장되도록 확인 필요 (현재 `*` 컬럼 선택이면 자동 포함).
