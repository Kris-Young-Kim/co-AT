# Quick Features (공지 읽음·VoC·소모품·회의) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4개 즉시 구현 기능 — 전사 공지 읽음 확인, 대상자 VoC 기록, 소모품 관리, 회의 체계화 — 을 순차적으로 추가한다.

**Architecture:**
- 각 기능은 독립적인 DB 마이그레이션 → Server Actions → UI 컴포넌트 순으로 구현
- 기존 패턴(inventory → supplies, schedules → meeting, notices → notice_reads, clients → voc) 그대로 재사용
- Next.js App Router Server Components + Server Actions + shadcn/ui

**Tech Stack:** Next.js 16, Supabase (Postgres + RLS), Clerk Auth, React Query v5, shadcn/ui, TypeScript, Tailwind

---

## ══════════════════════════════
## FEATURE 1: 전사 공지 읽음 확인
## ══════════════════════════════

### 파일 구조

| 역할 | 경로 |
|------|------|
| DB 마이그레이션 | `migrations/022_create_notice_reads.sql` |
| Server Actions | `actions/notice-actions.ts` (기존 파일에 추가) |
| 관리자 NoticeList | `components/features/admin/notices/NoticeList.tsx` (수정) |
| 공지 상세 (자동 읽음) | `app/(admin)/notices-management/[id]/page.tsx` (신규) |
| 읽음 현황 모달 | `components/features/admin/notices/NoticeReadStatusModal.tsx` (신규) |

---

### Task 1: notice_reads 마이그레이션

**Files:**
- Create: `migrations/022_create_notice_reads.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- migrations/022_create_notice_reads.sql

CREATE TABLE IF NOT EXISTS notice_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(notice_id, clerk_user_id)
);

CREATE INDEX IF NOT EXISTS idx_notice_reads_notice_id ON notice_reads(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_reads_clerk_user_id ON notice_reads(clerk_user_id);

-- RLS 비활성화 (개발 환경 - 기존 패턴과 동일)
ALTER TABLE notice_reads DISABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Supabase SQL Editor에서 실행**

Supabase 대시보드 → SQL Editor → 위 SQL 붙여넣기 → Run

확인: `SELECT * FROM notice_reads LIMIT 1;` 오류 없이 실행되면 성공

- [ ] **Step 3: 커밋**

```bash
git add migrations/022_create_notice_reads.sql
git commit -m "feat: notice_reads 테이블 마이그레이션 추가"
```

---

### Task 2: 공지 읽음 Server Actions 추가

**Files:**
- Modify: `actions/notice-actions.ts`

- [ ] **Step 1: 파일 하단에 3개 함수 추가**

`actions/notice-actions.ts` 파일 맨 끝에 다음 코드를 추가:

```typescript
// ─── 공지 읽음 확인 ───────────────────────────────────────────

export async function markNoticeAsRead(noticeId: string): Promise<{ success: boolean }> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false }

    const supabase = await createAdminClient()
    await supabase
      .from('notice_reads')
      .upsert(
        { notice_id: noticeId, clerk_user_id: userId, read_at: new Date().toISOString() },
        { onConflict: 'notice_id,clerk_user_id' }
      )

    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function getNoticeReadStatus(noticeId: string): Promise<{
  success: boolean
  reads?: { clerk_user_id: string; read_at: string }[]
  readCount?: number
  error?: string
}> {
  try {
    await hasAdminOrStaffPermission()
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('notice_reads')
      .select('clerk_user_id, read_at')
      .eq('notice_id', noticeId)
      .order('read_at', { ascending: false })

    if (error) throw error
    return { success: true, reads: data ?? [], readCount: data?.length ?? 0 }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function getMyUnreadNoticeCount(): Promise<number> {
  try {
    const { userId } = await auth()
    if (!userId) return 0

    const supabase = await createAdminClient()

    // 전체 공지 수
    const { count: totalCount } = await supabase
      .from('notices')
      .select('*', { count: 'exact', head: true })

    // 내가 읽은 공지 수
    const { count: readCount } = await supabase
      .from('notice_reads')
      .select('*', { count: 'exact', head: true })
      .eq('clerk_user_id', userId)

    return Math.max(0, (totalCount ?? 0) - (readCount ?? 0))
  } catch {
    return 0
  }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd D:/AILeader1/project/valuewith/co-AT
pnpm run build --webpack 2>&1 | tail -5
```

Expected: `✓ Compiled successfully` (또는 타입 오류 없이 통과)

- [ ] **Step 3: 커밋**

```bash
git add actions/notice-actions.ts
git commit -m "feat: 공지 읽음 server actions 추가 (markNoticeAsRead, getNoticeReadStatus, getMyUnreadNoticeCount)"
```

---

### Task 3: 관리자 공지 목록에 읽음 현황 배지 추가

**Files:**
- Create: `components/features/admin/notices/NoticeReadStatusModal.tsx`
- Modify: `components/features/admin/notices/NoticeList.tsx`

- [ ] **Step 1: NoticeReadStatusModal 컴포넌트 작성**

```typescript
// components/features/admin/notices/NoticeReadStatusModal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle } from "lucide-react"
import { getNoticeReadStatus } from "@/actions/notice-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface NoticeReadStatusModalProps {
  noticeId: string
  noticeTitle: string
  open: boolean
  onClose: () => void
}

export function NoticeReadStatusModal({
  noticeId,
  noticeTitle,
  open,
  onClose,
}: NoticeReadStatusModalProps) {
  const [reads, setReads] = useState<{ clerk_user_id: string; read_at: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const loadData = async () => {
    if (loaded) return
    setLoading(true)
    const result = await getNoticeReadStatus(noticeId)
    if (result.success) {
      setReads(result.reads ?? [])
      setLoaded(true)
    }
    setLoading(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) loadData()
    else onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            읽음 현황
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{noticeTitle}</p>
        </DialogHeader>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground py-4 text-center">로딩 중...</p>}
          {!loading && reads.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">아직 읽은 직원이 없습니다.</p>
          )}
          {reads.map((r) => (
            <div key={r.clerk_user_id} className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-mono text-muted-foreground">{r.clerk_user_id.slice(-8)}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(r.read_at), "MM/dd HH:mm", { locale: ko })}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <Badge variant="outline">총 {reads.length}명 읽음</Badge>
          <Button variant="outline" size="sm" onClick={onClose}>닫기</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: NoticeList.tsx에 읽음 현황 버튼 추가**

`components/features/admin/notices/NoticeList.tsx` 파일을 읽고 아래 변경 사항을 적용:

**import 추가** (파일 상단 import 블록에):
```typescript
import { NoticeReadStatusModal } from "./NoticeReadStatusModal"
```

**useState 추가** (컴포넌트 내 기존 state 아래):
```typescript
const [readStatusModal, setReadStatusModal] = useState<{ open: boolean; noticeId: string; noticeTitle: string }>({
  open: false,
  noticeId: '',
  noticeTitle: '',
})
```

**각 공지 카드의 액션 버튼 영역** (Edit, Trash2 버튼과 나란히)에 버튼 추가:
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => setReadStatusModal({ open: true, noticeId: notice.id, noticeTitle: notice.title })}
  title="읽음 현황"
>
  <Users className="h-4 w-4" />
</Button>
```

**JSX 최하단** (`</Card>` 이후)에 모달 추가:
```tsx
<NoticeReadStatusModal
  noticeId={readStatusModal.noticeId}
  noticeTitle={readStatusModal.noticeTitle}
  open={readStatusModal.open}
  onClose={() => setReadStatusModal(prev => ({ ...prev, open: false }))}
/>
```

**import에 `Users` 아이콘 추가**:
```typescript
import { Pin, Calendar, Edit, Trash2, AlertTriangle, Users } from "lucide-react"
```

- [ ] **Step 3: 관리자 공지 상세 페이지 (읽음 자동 마킹)**

공지 상세를 볼 때 자동으로 읽음 처리하려면, 관리자 공지 목록 클릭 시 `markNoticeAsRead`를 호출해야 한다.
가장 간단한 방법: NoticeList에서 공지 제목 클릭 시 서버 액션 호출 후 라우팅.

`NoticeList.tsx`에서 공지 제목 부분을 버튼으로 감싸서:
```tsx
<button
  className="text-left font-semibold hover:underline"
  onClick={async () => {
    await markNoticeAsRead(notice.id)
    router.refresh()
  }}
>
  {notice.title}
</button>
```

**import 추가**:
```typescript
import { markNoticeAsRead } from "@/actions/notice-actions"
```

- [ ] **Step 4: 빌드 확인**

```bash
pnpm run build --webpack 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5: 커밋**

```bash
git add components/features/admin/notices/NoticeReadStatusModal.tsx
git add components/features/admin/notices/NoticeList.tsx
git commit -m "feat: 전사 공지 읽음 확인 UI - 관리자 읽음 현황 모달"
```

---

## ══════════════════════════════
## FEATURE 2: 대상자 VoC 기록
## ══════════════════════════════

### 파일 구조

| 역할 | 경로 |
|------|------|
| DB 마이그레이션 | `migrations/023_create_client_voc.sql` |
| Server Actions | `actions/voc-actions.ts` (신규) |
| VoC 탭 컴포넌트 | `components/features/crm/ClientVocTab.tsx` (신규) |
| 대상자 상세 페이지 | `app/(admin)/clients/[id]/page.tsx` (voc 탭 추가) |

---

### Task 4: client_voc 마이그레이션

**Files:**
- Create: `migrations/023_create_client_voc.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- migrations/023_create_client_voc.sql

CREATE TABLE IF NOT EXISTS client_voc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('complaint', 'suggestion', 'praise')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  response TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_voc_client_id ON client_voc(client_id);
CREATE INDEX IF NOT EXISTS idx_client_voc_type ON client_voc(type);
CREATE INDEX IF NOT EXISTS idx_client_voc_status ON client_voc(status);

ALTER TABLE client_voc DISABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Supabase SQL Editor에서 실행**

실행 후 확인: `SELECT * FROM client_voc LIMIT 1;` 오류 없이 실행

- [ ] **Step 3: 커밋**

```bash
git add migrations/023_create_client_voc.sql
git commit -m "feat: client_voc 테이블 마이그레이션 추가"
```

---

### Task 5: VoC Server Actions

**Files:**
- Create: `actions/voc-actions.ts`

- [ ] **Step 1: actions/voc-actions.ts 작성**

```typescript
// actions/voc-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export type VocType = 'complaint' | 'suggestion' | 'praise'
export type VocStatus = 'open' | 'resolved'

export interface ClientVoc {
  id: string
  client_id: string
  type: VocType
  content: string
  status: VocStatus
  response: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateVocInput {
  client_id: string
  type: VocType
  content: string
}

export async function getClientVocs(clientId: string): Promise<{
  success: boolean
  vocs?: ClientVoc[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('client_voc')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, vocs: data as ClientVoc[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function createClientVoc(input: CreateVocInput): Promise<{
  success: boolean
  voc?: ClientVoc
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')
    if (!input.content.trim()) throw new Error('내용을 입력해주세요')

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('client_voc')
      .insert({ ...input, created_by: userId })
      .select()
      .single()

    if (error) throw error
    revalidatePath(`/admin/clients/${input.client_id}`)
    return { success: true, voc: data as ClientVoc }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function resolveClientVoc(
  vocId: string,
  clientId: string,
  response: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('client_voc')
      .update({ status: 'resolved', response, updated_at: new Date().toISOString() })
      .eq('id', vocId)

    if (error) throw error
    revalidatePath(`/admin/clients/${clientId}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteClientVoc(
  vocId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = await createAdminClient()
    const { error } = await supabase.from('client_voc').delete().eq('id', vocId)

    if (error) throw error
    revalidatePath(`/admin/clients/${clientId}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
```

- [ ] **Step 2: createAdminClient import 경로 확인**

```bash
ls D:/AILeader1/project/valuewith/co-AT/lib/supabase/
```

`admin.ts`가 있으면 `@/lib/supabase/admin`, 없으면 `server.ts`를 사용하는 `createClient` 패턴으로 변경.
(기존 notice-actions.ts에서 사용하는 import 경로 확인 후 동일하게 적용)

- [ ] **Step 3: 빌드 확인**

```bash
pnpm run build --webpack 2>&1 | tail -5
```

- [ ] **Step 4: 커밋**

```bash
git add actions/voc-actions.ts
git commit -m "feat: 대상자 VoC server actions (CRUD)"
```

---

### Task 6: ClientVocTab 컴포넌트

**Files:**
- Create: `components/features/crm/ClientVocTab.tsx`
- Modify: `app/(admin)/clients/[id]/page.tsx`

- [ ] **Step 1: ClientVocTab.tsx 작성**

```typescript
// components/features/crm/ClientVocTab.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { AlertTriangle, Lightbulb, ThumbsUp, Plus, CheckCircle, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import {
  getClientVocs,
  createClientVoc,
  resolveClientVoc,
  deleteClientVoc,
  type ClientVoc,
  type VocType,
} from "@/actions/voc-actions"

const VOC_TYPE_CONFIG = {
  complaint: { label: '불만', icon: AlertTriangle, color: 'destructive' as const },
  suggestion: { label: '개선사항', icon: Lightbulb, color: 'default' as const },
  praise: { label: '칭찬', icon: ThumbsUp, color: 'default' as const },
} as const

interface ClientVocTabProps {
  clientId: string
}

export function ClientVocTab({ clientId }: ClientVocTabProps) {
  const [vocs, setVocs] = useState<ClientVoc[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [resolveTarget, setResolveTarget] = useState<ClientVoc | null>(null)
  const [newType, setNewType] = useState<VocType>('complaint')
  const [newContent, setNewContent] = useState('')
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadVocs = async () => {
    setLoading(true)
    const result = await getClientVocs(clientId)
    if (result.success) setVocs(result.vocs ?? [])
    setLoading(false)
  }

  useEffect(() => { loadVocs() }, [clientId])

  const handleCreate = async () => {
    if (!newContent.trim()) return
    setSubmitting(true)
    const result = await createClientVoc({ client_id: clientId, type: newType, content: newContent })
    if (result.success && result.voc) {
      setVocs(prev => [result.voc!, ...prev])
      setCreateOpen(false)
      setNewContent('')
      setNewType('complaint')
    } else {
      alert(result.error || '등록에 실패했습니다')
    }
    setSubmitting(false)
  }

  const handleResolve = async () => {
    if (!resolveTarget) return
    setSubmitting(true)
    const result = await resolveClientVoc(resolveTarget.id, clientId, responseText)
    if (result.success) {
      setVocs(prev => prev.map(v => v.id === resolveTarget.id
        ? { ...v, status: 'resolved', response: responseText }
        : v
      ))
      setResolveTarget(null)
      setResponseText('')
    } else {
      alert(result.error || '처리에 실패했습니다')
    }
    setSubmitting(false)
  }

  const handleDelete = async (voc: ClientVoc) => {
    if (!confirm('삭제하시겠습니까?')) return
    const result = await deleteClientVoc(voc.id, clientId)
    if (result.success) {
      setVocs(prev => prev.filter(v => v.id !== voc.id))
    }
  }

  const openCount = vocs.filter(v => v.status === 'open').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">VoC 기록</h3>
          {openCount > 0 && <Badge variant="destructive">{openCount}건 미처리</Badge>}
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          새 기록
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">로딩 중...</p>}

      {!loading && vocs.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            등록된 VoC 기록이 없습니다.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {vocs.map(voc => {
          const config = VOC_TYPE_CONFIG[voc.type]
          const Icon = config.icon
          return (
            <Card key={voc.id} className={voc.status === 'resolved' ? 'opacity-70' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <Badge variant={config.color}>{config.label}</Badge>
                    <Badge variant={voc.status === 'resolved' ? 'outline' : 'destructive'}>
                      {voc.status === 'resolved' ? '처리완료' : '미처리'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(voc.created_at), 'MM/dd', { locale: ko })}
                    </span>
                    {voc.status === 'open' && (
                      <Button variant="ghost" size="sm" onClick={() => { setResolveTarget(voc); setResponseText('') }}>
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(voc)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                <p className="text-sm">{voc.content}</p>
                {voc.response && (
                  <div className="bg-muted p-2 rounded text-sm">
                    <span className="font-medium text-xs text-muted-foreground">답변: </span>
                    {voc.response}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 새 VoC 등록 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>VoC 기록 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>유형</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as VocType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complaint">불만</SelectItem>
                  <SelectItem value="suggestion">개선사항</SelectItem>
                  <SelectItem value="praise">칭찬</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>내용</Label>
              <Textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>취소</Button>
            <Button onClick={handleCreate} disabled={submitting || !newContent.trim()}>
              {submitting ? '등록 중...' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 처리 완료 */}
      <Dialog open={!!resolveTarget} onOpenChange={(open) => { if (!open) setResolveTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>처리 완료 처리</DialogTitle>
          </DialogHeader>
          <div>
            <Label>답변 (선택)</Label>
            <Textarea
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
              placeholder="처리 내용 또는 답변을 입력하세요"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveTarget(null)}>취소</Button>
            <Button onClick={handleResolve} disabled={submitting}>
              {submitting ? '처리 중...' : '처리 완료'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 2: 대상자 상세 페이지에 VoC 탭 추가**

`app/(admin)/clients/[id]/page.tsx` 파일을 읽고:

1. dynamic import 추가 (기존 dynamic imports 아래에):
```typescript
const ClientVocTab = dynamic(
  () => import("@/components/features/crm/ClientVocTab").then((mod) => ({ default: mod.ClientVocTab })),
  { loading: () => <div className="py-8 text-center text-muted-foreground">VoC 로딩 중...</div> }
)
```

2. `<TabsList>` 안에 탭 버튼 추가 (기존 탭들 다음에):
```tsx
<TabsTrigger value="voc">VoC</TabsTrigger>
```

3. `<TabsContent>` 블록 추가 (기존 content들 다음에):
```tsx
<TabsContent value="voc">
  <ClientVocTab clientId={clientResult.client.id} />
</TabsContent>
```

- [ ] **Step 3: 빌드 확인**

```bash
pnpm run build --webpack 2>&1 | tail -5
```

- [ ] **Step 4: 커밋**

```bash
git add components/features/crm/ClientVocTab.tsx
git add app/(admin)/clients/[id]/page.tsx
git commit -m "feat: 대상자 VoC 기록 탭 - 불만/개선사항/칭찬 CRUD"
```

---

## ══════════════════════════════
## FEATURE 3: 소모품 관리
## ══════════════════════════════

### 파일 구조

| 역할 | 경로 |
|------|------|
| DB 마이그레이션 | `migrations/024_create_supplies.sql` |
| Server Actions | `actions/supplies-actions.ts` (신규) |
| 페이지 | `app/(admin)/supplies/page.tsx` (신규) |
| 메인 컴포넌트 | `components/features/supplies/SuppliesManagementContent.tsx` (신규) |
| 폼 다이얼로그 | `components/features/supplies/SupplyFormDialog.tsx` (신규) |
| 거래 모달 | `components/features/supplies/SupplyTransactionModal.tsx` (신규) |
| 사이드바 메뉴 | `components/layout/admin-sidebar.tsx` (수정) |
| 모바일 하단 바 | `components/layout/admin-mobile-bottom-nav.tsx` (수정) |

---

### Task 7: supplies 마이그레이션

**Files:**
- Create: `migrations/024_create_supplies.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- migrations/024_create_supplies.sql

CREATE TABLE IF NOT EXISTS supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL DEFAULT '개',
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supply_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id UUID NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplies_category ON supplies(category);
CREATE INDEX IF NOT EXISTS idx_supply_transactions_supply_id ON supply_transactions(supply_id);
CREATE INDEX IF NOT EXISTS idx_supply_transactions_created_at ON supply_transactions(created_at DESC);

ALTER TABLE supplies DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_transactions DISABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Supabase SQL Editor에서 실행**

- [ ] **Step 3: 커밋**

```bash
git add migrations/024_create_supplies.sql
git commit -m "feat: supplies, supply_transactions 테이블 마이그레이션"
```

---

### Task 8: Supplies Server Actions

**Files:**
- Create: `actions/supplies-actions.ts`

- [ ] **Step 1: actions/supplies-actions.ts 작성**

```typescript
// actions/supplies-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export interface Supply {
  id: string
  name: string
  category: string | null
  unit: string
  current_stock: number
  minimum_stock: number
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupplyTransaction {
  id: string
  supply_id: string
  type: 'in' | 'out'
  quantity: number
  reason: string | null
  clerk_user_id: string
  created_at: string
}

export interface CreateSupplyInput {
  name: string
  category?: string
  unit?: string
  current_stock?: number
  minimum_stock?: number
  location?: string
  notes?: string
}

export async function getSupplies(): Promise<{
  success: boolean
  supplies?: Supply[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('supplies')
      .select('*')
      .order('name')

    if (error) throw error
    return { success: true, supplies: data as Supply[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function createSupply(input: CreateSupplyInput): Promise<{
  success: boolean
  supply?: Supply
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('supplies')
      .insert({
        name: input.name,
        category: input.category ?? null,
        unit: input.unit ?? '개',
        current_stock: input.current_stock ?? 0,
        minimum_stock: input.minimum_stock ?? 0,
        location: input.location ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single()

    if (error) throw error
    revalidatePath('/admin/supplies')
    return { success: true, supply: data as Supply }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function updateSupply(
  id: string,
  input: Partial<CreateSupplyInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('supplies')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    revalidatePath('/admin/supplies')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteSupply(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = await createAdminClient()
    const { error } = await supabase.from('supplies').delete().eq('id', id)

    if (error) throw error
    revalidatePath('/admin/supplies')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function addSupplyTransaction(
  supplyId: string,
  type: 'in' | 'out',
  quantity: number,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = await createAdminClient()

    // 현재 재고 확인
    const { data: supply } = await supabase
      .from('supplies')
      .select('current_stock')
      .eq('id', supplyId)
      .single()

    if (!supply) throw new Error('소모품을 찾을 수 없습니다')

    const newStock = type === 'in'
      ? supply.current_stock + quantity
      : supply.current_stock - quantity

    if (newStock < 0) throw new Error('재고가 부족합니다')

    // 거래 기록 + 재고 업데이트
    await supabase.from('supply_transactions').insert({
      supply_id: supplyId,
      type,
      quantity,
      reason: reason ?? null,
      clerk_user_id: userId,
    })

    await supabase
      .from('supplies')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', supplyId)

    revalidatePath('/admin/supplies')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function getSupplyTransactions(supplyId: string): Promise<{
  success: boolean
  transactions?: SupplyTransaction[]
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('supply_transactions')
      .select('*')
      .eq('supply_id', supplyId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return { success: true, transactions: data as SupplyTransaction[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
pnpm run build --webpack 2>&1 | tail -5
```

- [ ] **Step 3: 커밋**

```bash
git add actions/supplies-actions.ts
git commit -m "feat: 소모품 관리 server actions (CRUD + 입출고)"
```

---

### Task 9: Supplies UI 컴포넌트

**Files:**
- Create: `components/features/supplies/SupplyFormDialog.tsx`
- Create: `components/features/supplies/SupplyTransactionModal.tsx`
- Create: `components/features/supplies/SuppliesManagementContent.tsx`
- Create: `app/(admin)/supplies/page.tsx`

- [ ] **Step 1: SupplyFormDialog.tsx 작성**

```typescript
// components/features/supplies/SupplyFormDialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createSupply, updateSupply, type Supply, type CreateSupplyInput } from "@/actions/supplies-actions"

interface SupplyFormDialogProps {
  open: boolean
  onClose: () => void
  supply?: Supply | null
  onSuccess: (supply: Supply) => void
}

export function SupplyFormDialog({ open, onClose, supply, onSuccess }: SupplyFormDialogProps) {
  const [form, setForm] = useState<CreateSupplyInput>({
    name: supply?.name ?? '',
    category: supply?.category ?? '',
    unit: supply?.unit ?? '개',
    current_stock: supply?.current_stock ?? 0,
    minimum_stock: supply?.minimum_stock ?? 0,
    location: supply?.location ?? '',
    notes: supply?.notes ?? '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setSubmitting(true)

    if (supply) {
      const result = await updateSupply(supply.id, form)
      if (result.success) {
        onSuccess({ ...supply, ...form } as Supply)
        onClose()
      } else {
        alert(result.error || '수정에 실패했습니다')
      }
    } else {
      const result = await createSupply(form)
      if (result.success && result.supply) {
        onSuccess(result.supply)
        onClose()
      } else {
        alert(result.error || '등록에 실패했습니다')
      }
    }
    setSubmitting(false)
  }

  const field = (key: keyof CreateSupplyInput, label: string, type = 'text') => (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={String(form[key] ?? '')}
        onChange={e => setForm(prev => ({
          ...prev,
          [key]: type === 'number' ? Number(e.target.value) : e.target.value
        }))}
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supply ? '소모품 수정' : '소모품 등록'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {field('name', '품명 *')}
          {field('category', '분류')}
          {field('unit', '단위 (개, 박스, 롤 등)')}
          {field('current_stock', '현재 재고', 'number')}
          {field('minimum_stock', '최소 재고 (알림 기준)', 'number')}
          {field('location', '보관 위치')}
          <div>
            <Label>비고</Label>
            <Textarea
              value={form.notes ?? ''}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.name?.trim()}>
            {submitting ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: SupplyTransactionModal.tsx 작성**

```typescript
// components/features/supplies/SupplyTransactionModal.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { addSupplyTransaction, getSupplyTransactions, type Supply, type SupplyTransaction } from "@/actions/supplies-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface SupplyTransactionModalProps {
  supply: Supply | null
  onClose: () => void
  onStockChange: (supplyId: string, newStock: number) => void
}

export function SupplyTransactionModal({ supply, onClose, onStockChange }: SupplyTransactionModalProps) {
  const [txType, setTxType] = useState<'in' | 'out'>('in')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [transactions, setTransactions] = useState<SupplyTransaction[]>([])
  const [loadingTx, setLoadingTx] = useState(false)

  useEffect(() => {
    if (!supply) return
    setLoadingTx(true)
    getSupplyTransactions(supply.id).then(result => {
      if (result.success) setTransactions(result.transactions ?? [])
      setLoadingTx(false)
    })
  }, [supply?.id])

  const handleSubmit = async () => {
    if (!supply || quantity <= 0) return
    setSubmitting(true)
    const result = await addSupplyTransaction(supply.id, txType, quantity, reason)
    if (result.success) {
      const newStock = txType === 'in'
        ? supply.current_stock + quantity
        : supply.current_stock - quantity
      onStockChange(supply.id, newStock)
      onClose()
    } else {
      alert(result.error || '처리에 실패했습니다')
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={!!supply} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>입출고 처리</DialogTitle>
          {supply && <p className="text-sm text-muted-foreground">{supply.name} | 현재 재고: {supply.current_stock} {supply.unit}</p>}
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={txType === 'in' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setTxType('in')}
            >
              <ArrowDownCircle className="h-4 w-4 mr-1" />
              입고
            </Button>
            <Button
              variant={txType === 'out' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setTxType('out')}
            >
              <ArrowUpCircle className="h-4 w-4 mr-1" />
              출고
            </Button>
          </div>

          <div>
            <Label>수량</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
            />
          </div>

          <div>
            <Label>사유 (선택)</Label>
            <Input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="구매, 사용, 폐기 등"
            />
          </div>

          {/* 최근 거래 내역 */}
          <div>
            <Label className="text-xs text-muted-foreground">최근 거래 내역</Label>
            <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
              {loadingTx && <p className="text-xs text-muted-foreground">로딩 중...</p>}
              {!loadingTx && transactions.length === 0 && (
                <p className="text-xs text-muted-foreground">거래 내역이 없습니다.</p>
              )}
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Badge variant={tx.type === 'in' ? 'default' : 'outline'} className="text-xs px-1 py-0">
                      {tx.type === 'in' ? '입고' : '출고'}
                    </Badge>
                    <span>{tx.quantity}개</span>
                    {tx.reason && <span className="text-muted-foreground">({tx.reason})</span>}
                  </div>
                  <span className="text-muted-foreground">
                    {format(new Date(tx.created_at), 'MM/dd', { locale: ko })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={submitting || quantity <= 0}>
            {submitting ? '처리 중...' : '처리'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: SuppliesManagementContent.tsx 작성**

```typescript
// components/features/supplies/SuppliesManagementContent.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, ArrowDownCircle, AlertTriangle, Search } from "lucide-react"
import { deleteSupply, type Supply } from "@/actions/supplies-actions"
import { SupplyFormDialog } from "./SupplyFormDialog"
import { SupplyTransactionModal } from "./SupplyTransactionModal"

interface SuppliesManagementContentProps {
  initialSupplies: Supply[]
}

export function SuppliesManagementContent({ initialSupplies }: SuppliesManagementContentProps) {
  const [supplies, setSupplies] = useState(initialSupplies)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Supply | null>(null)
  const [txTarget, setTxTarget] = useState<Supply | null>(null)

  const filtered = supplies.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (supply: Supply) => {
    if (!confirm(`"${supply.name}"을 삭제하시겠습니까?`)) return
    const result = await deleteSupply(supply.id)
    if (result.success) {
      setSupplies(prev => prev.filter(s => s.id !== supply.id))
    } else {
      alert(result.error || '삭제에 실패했습니다')
    }
  }

  const handleFormSuccess = (supply: Supply) => {
    setSupplies(prev => {
      const exists = prev.find(s => s.id === supply.id)
      if (exists) return prev.map(s => s.id === supply.id ? supply : s)
      return [supply, ...prev]
    })
    setEditTarget(null)
    setFormOpen(false)
  }

  const handleStockChange = (supplyId: string, newStock: number) => {
    setSupplies(prev => prev.map(s =>
      s.id === supplyId ? { ...s, current_stock: newStock } : s
    ))
  }

  const lowStockCount = supplies.filter(s => s.current_stock <= s.minimum_stock && s.minimum_stock > 0).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">소모품 관리</h1>
          {lowStockCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              재고 부족 {lowStockCount}건
            </Badge>
          )}
        </div>
        <Button onClick={() => { setEditTarget(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          소모품 등록
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="품명 또는 분류 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {search ? '검색 결과가 없습니다.' : '등록된 소모품이 없습니다.'}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(supply => {
          const isLow = supply.minimum_stock > 0 && supply.current_stock <= supply.minimum_stock
          return (
            <Card key={supply.id} className={isLow ? 'border-destructive' : ''}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{supply.name}</p>
                    {supply.category && (
                      <p className="text-xs text-muted-foreground">{supply.category}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setTxTarget(supply)}>
                      <ArrowDownCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditTarget(supply); setFormOpen(true) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(supply)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {supply.current_stock}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{supply.unit}</span>
                  </div>
                  {isLow && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      재고 부족
                    </Badge>
                  )}
                </div>

                {supply.location && (
                  <p className="text-xs text-muted-foreground">위치: {supply.location}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <SupplyFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        supply={editTarget}
        onSuccess={handleFormSuccess}
      />

      <SupplyTransactionModal
        supply={txTarget}
        onClose={() => setTxTarget(null)}
        onStockChange={handleStockChange}
      />
    </div>
  )
}
```

- [ ] **Step 4: app/(admin)/supplies/page.tsx 작성**

```typescript
// app/(admin)/supplies/page.tsx
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { getSupplies } from "@/actions/supplies-actions"
import { SuppliesManagementContent } from "@/components/features/supplies/SuppliesManagementContent"

export const metadata = { title: "소모품 관리" }

export default async function SuppliesPage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) redirect("/")

  const result = await getSupplies()
  const supplies = result.success ? (result.supplies ?? []) : []

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <SuppliesManagementContent initialSupplies={supplies} />
    </div>
  )
}
```

- [ ] **Step 5: 사이드바에 소모품 관리 메뉴 추가**

`components/layout/admin-sidebar.tsx` 파일에서 기존 메뉴 구조를 확인하여 적절한 위치에 추가:

```typescript
// import 추가
import { Package } from "lucide-react"

// 메뉴 항목 추가 (inventory 항목 근처에)
{
  href: '/admin/supplies',
  label: '소모품 관리',
  icon: Package,
}
```

`components/layout/admin-mobile-bottom-nav.tsx`에도 동일하게 `Package` 아이콘으로 추가.

- [ ] **Step 6: 빌드 확인**

```bash
pnpm run build --webpack 2>&1 | tail -5
```

- [ ] **Step 7: 커밋**

```bash
git add components/features/supplies/
git add app/(admin)/supplies/
git add components/layout/admin-sidebar.tsx
git add components/layout/admin-mobile-bottom-nav.tsx
git commit -m "feat: 소모품 관리 페이지 - 재고 추적 + 입출고 처리"
```

---

## ══════════════════════════════
## FEATURE 4: 회의 체계화
## ══════════════════════════════

### 파일 구조

| 역할 | 경로 |
|------|------|
| DB 마이그레이션 | `migrations/025_create_meeting_minutes.sql` |
| Server Actions | `actions/meeting-actions.ts` (신규) |
| 회의록 모달 | `components/features/schedule/MeetingMinutesModal.tsx` (신규) |
| 일정 폼 | `components/features/schedule/ScheduleForm.tsx` (수정 - meeting 타입 추가) |
| 일정 관리 콘텐츠 | `components/features/schedule/ScheduleManagementContent.tsx` (수정 - 회의록 버튼) |

---

### Task 10: meeting_minutes 마이그레이션

**Files:**
- Create: `migrations/025_create_meeting_minutes.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- migrations/025_create_meeting_minutes.sql

-- schedules 테이블 schedule_type에 'meeting' 추가
ALTER TABLE schedules
  DROP CONSTRAINT IF EXISTS schedules_schedule_type_check;

ALTER TABLE schedules
  ADD CONSTRAINT schedules_schedule_type_check
  CHECK (schedule_type IN (
    'visit', 'consult', 'assessment', 'delivery', 'pickup',
    'exhibition', 'education', 'custom_make', 'meeting'
  ));

-- 회의록 테이블
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL DEFAULT 'weekly' CHECK (meeting_type IN (
    'weekly', 'monthly', 'biweekly_policy', 'other'
  )),
  attendees TEXT[] DEFAULT '{}',
  agenda TEXT,
  minutes TEXT,
  action_items JSONB DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(schedule_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_schedule_id ON meeting_minutes(schedule_id);

ALTER TABLE meeting_minutes DISABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Supabase SQL Editor에서 실행**

- [ ] **Step 3: 커밋**

```bash
git add migrations/025_create_meeting_minutes.sql
git commit -m "feat: meeting schedule_type + meeting_minutes 테이블 마이그레이션"
```

---

### Task 11: Meeting Server Actions

**Files:**
- Create: `actions/meeting-actions.ts`

- [ ] **Step 1: actions/meeting-actions.ts 작성**

```typescript
// actions/meeting-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export type MeetingType = 'weekly' | 'monthly' | 'biweekly_policy' | 'other'

export interface ActionItem {
  id: string
  content: string
  assignee: string
  done: boolean
}

export interface MeetingMinutes {
  id: string
  schedule_id: string
  meeting_type: MeetingType
  attendees: string[]
  agenda: string | null
  minutes: string | null
  action_items: ActionItem[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface SaveMeetingMinutesInput {
  schedule_id: string
  meeting_type: MeetingType
  attendees: string[]
  agenda?: string
  minutes?: string
  action_items?: ActionItem[]
}

export async function getMeetingMinutes(scheduleId: string): Promise<{
  success: boolean
  minutes?: MeetingMinutes | null
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('meeting_minutes')
      .select('*')
      .eq('schedule_id', scheduleId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { success: true, minutes: data as MeetingMinutes | null }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function saveMeetingMinutes(input: SaveMeetingMinutesInput): Promise<{
  success: boolean
  minutes?: MeetingMinutes
  error?: string
}> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('인증이 필요합니다')

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('meeting_minutes')
      .upsert(
        {
          schedule_id: input.schedule_id,
          meeting_type: input.meeting_type,
          attendees: input.attendees,
          agenda: input.agenda ?? null,
          minutes: input.minutes ?? null,
          action_items: input.action_items ?? [],
          created_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'schedule_id' }
      )
      .select()
      .single()

    if (error) throw error
    revalidatePath('/admin/schedule')
    return { success: true, minutes: data as MeetingMinutes }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
pnpm run build --webpack 2>&1 | tail -5
```

- [ ] **Step 3: 커밋**

```bash
git add actions/meeting-actions.ts
git commit -m "feat: 회의 server actions (getMeetingMinutes, saveMeetingMinutes)"
```

---

### Task 12: MeetingMinutesModal 컴포넌트

**Files:**
- Create: `components/features/schedule/MeetingMinutesModal.tsx`

- [ ] **Step 1: MeetingMinutesModal.tsx 작성**

```typescript
// components/features/schedule/MeetingMinutesModal.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { getMeetingMinutes, saveMeetingMinutes, type MeetingType, type ActionItem } from "@/actions/meeting-actions"

const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  weekly: '주간팀회의',
  monthly: '월례회의',
  biweekly_policy: '2주 정책결정회의',
  other: '기타',
}

interface MeetingMinutesModalProps {
  scheduleId: string | null
  scheduleName: string
  onClose: () => void
}

export function MeetingMinutesModal({ scheduleId, scheduleName, onClose }: MeetingMinutesModalProps) {
  const [meetingType, setMeetingType] = useState<MeetingType>('weekly')
  const [attendees, setAttendees] = useState('')
  const [agenda, setAgenda] = useState('')
  const [minutes, setMinutes] = useState('')
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [newAction, setNewAction] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!scheduleId) return
    setLoading(true)
    getMeetingMinutes(scheduleId).then(result => {
      if (result.success && result.minutes) {
        const m = result.minutes
        setMeetingType(m.meeting_type)
        setAttendees(m.attendees.join(', '))
        setAgenda(m.agenda ?? '')
        setMinutes(m.minutes ?? '')
        setActionItems(m.action_items ?? [])
      }
      setLoading(false)
    })
  }, [scheduleId])

  const addActionItem = () => {
    if (!newAction.trim()) return
    setActionItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), content: newAction, assignee: newAssignee, done: false }
    ])
    setNewAction('')
    setNewAssignee('')
  }

  const toggleActionItem = (id: string) => {
    setActionItems(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a))
  }

  const removeActionItem = (id: string) => {
    setActionItems(prev => prev.filter(a => a.id !== id))
  }

  const handleSave = async () => {
    if (!scheduleId) return
    setSubmitting(true)
    const result = await saveMeetingMinutes({
      schedule_id: scheduleId,
      meeting_type: meetingType,
      attendees: attendees.split(',').map(s => s.trim()).filter(Boolean),
      agenda: agenda || undefined,
      minutes: minutes || undefined,
      action_items: actionItems,
    })
    if (result.success) {
      onClose()
    } else {
      alert(result.error || '저장에 실패했습니다')
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={!!scheduleId} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>회의록</DialogTitle>
          <p className="text-sm text-muted-foreground">{scheduleName}</p>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-center py-4 text-muted-foreground">로딩 중...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>회의 유형</Label>
              <Select value={meetingType} onValueChange={(v) => setMeetingType(v as MeetingType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(MEETING_TYPE_LABELS) as [MeetingType, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>참석자 (쉼표로 구분)</Label>
              <Input
                value={attendees}
                onChange={e => setAttendees(e.target.value)}
                placeholder="홍길동, 김철수, ..."
              />
            </div>

            <div>
              <Label>안건</Label>
              <Textarea
                value={agenda}
                onChange={e => setAgenda(e.target.value)}
                placeholder="회의 안건을 입력하세요"
                rows={3}
              />
            </div>

            <div>
              <Label>회의록</Label>
              <Textarea
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                placeholder="회의 내용을 기록하세요"
                rows={5}
              />
            </div>

            <div>
              <Label>액션 아이템</Label>
              <div className="space-y-2 mt-1">
                {actionItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={item.done}
                      onCheckedChange={() => toggleActionItem(item.id)}
                    />
                    <span className={`flex-1 text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                      {item.content}
                    </span>
                    {item.assignee && (
                      <Badge variant="outline" className="text-xs">{item.assignee}</Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => removeActionItem(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={newAction}
                    onChange={e => setNewAction(e.target.value)}
                    placeholder="액션 아이템"
                    onKeyDown={e => { if (e.key === 'Enter') addActionItem() }}
                  />
                  <Input
                    className="w-24"
                    value={newAssignee}
                    onChange={e => setNewAssignee(e.target.value)}
                    placeholder="담당자"
                  />
                  <Button variant="outline" size="sm" onClick={addActionItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>닫기</Button>
          <Button onClick={handleSave} disabled={submitting || loading}>
            {submitting ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
pnpm run build --webpack 2>&1 | tail -5
```

- [ ] **Step 3: 커밋**

```bash
git add components/features/schedule/MeetingMinutesModal.tsx
git commit -m "feat: 회의록 모달 컴포넌트 (MeetingMinutesModal)"
```

---

### Task 13: ScheduleForm에 meeting 타입 추가 + ScheduleManagementContent에 회의록 버튼 추가

**Files:**
- Modify: `components/features/schedule/ScheduleForm.tsx`
- Modify: `components/features/schedule/ScheduleManagementContent.tsx`

- [ ] **Step 1: ScheduleForm.tsx에 'meeting' 타입 추가**

`components/features/schedule/ScheduleForm.tsx` 파일을 읽어서:

`schedule_type` select의 옵션 목록에 추가:
```tsx
<SelectItem value="meeting">회의</SelectItem>
```

TypeScript 타입(Schedule 인터페이스 또는 schedule_type 유니온)에도 `'meeting'` 추가.

- [ ] **Step 2: ScheduleManagementContent.tsx에 회의록 버튼 추가**

`components/features/schedule/ScheduleManagementContent.tsx` 파일을 읽어서:

1. import 추가:
```typescript
import { MeetingMinutesModal } from "./MeetingMinutesModal"
```

2. state 추가:
```typescript
const [meetingModal, setMeetingModal] = useState<{ scheduleId: string; scheduleName: string } | null>(null)
```

3. `schedule_type === 'meeting'`인 일정 카드/행에 회의록 버튼 추가:
```tsx
{schedule.schedule_type === 'meeting' && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setMeetingModal({ scheduleId: schedule.id, scheduleName: schedule.notes ?? '회의' })}
    title="회의록"
  >
    <FileText className="h-4 w-4" />
  </Button>
)}
```

4. JSX 하단에 모달 추가:
```tsx
<MeetingMinutesModal
  scheduleId={meetingModal?.scheduleId ?? null}
  scheduleName={meetingModal?.scheduleName ?? ''}
  onClose={() => setMeetingModal(null)}
/>
```

5. `FileText` lucide-react import 추가.

- [ ] **Step 3: 빌드 확인**

```bash
pnpm run build --webpack 2>&1 | tail -5
```

- [ ] **Step 4: 커밋**

```bash
git add components/features/schedule/ScheduleForm.tsx
git add components/features/schedule/ScheduleManagementContent.tsx
git commit -m "feat: 일정에 meeting 타입 추가 + 회의록 버튼 연결"
```

---

## 검증 방법

### Feature 1 - 공지 읽음
- 관리자로 로그인 → 공지사항 관리 페이지 이동
- 공지 제목 클릭 → 읽음 처리됨
- 공지 카드의 Users 아이콘 클릭 → 읽음 현황 모달 표시

### Feature 2 - VoC
- 대상자 상세 → VoC 탭 클릭
- "새 기록" 버튼 → 유형 선택 + 내용 입력 → 등록
- 미처리 VoC의 체크 아이콘 → 처리완료 처리

### Feature 3 - 소모품
- 사이드바 "소모품 관리" 클릭 → 소모품 목록 페이지
- "소모품 등록" 버튼 → 폼 입력 → 저장
- 입출고 아이콘 클릭 → 수량 입력 → 처리 → 재고 수치 업데이트 확인

### Feature 4 - 회의
- 일정 관리 → 새 일정 추가 → 유형 "회의" 선택 → 저장
- 회의 일정의 FileText 아이콘 클릭 → 회의록 모달
- 안건, 회의록, 액션아이템 입력 → 저장
