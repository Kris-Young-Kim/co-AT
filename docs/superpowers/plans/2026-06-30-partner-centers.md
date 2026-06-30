# Partner Centers (협력기관 연락망) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** admin 앱에 전국 17개 보조기기센터 연락망 CRUD 페이지를 추가한다.

**Architecture:** Supabase `partner_centers` 테이블에 17개 센터 초기 데이터를 INSERT하고, Server Actions(`withStaffPermission` 래퍼)로 CRUD를 처리한다. 서버 컴포넌트 페이지가 초기 데이터를 fetch해 클라이언트 컴포넌트에 전달하는 기존 banners 패턴을 그대로 따른다.

**Tech Stack:** Next.js App Router (서버/클라이언트 컴포넌트), Supabase (PostgreSQL + RLS), Clerk (`hasAdminOrStaffPermission`), shadcn/ui, Tailwind CSS, lucide-react

---

## File Map

| 역할 | 파일 |
|------|------|
| DB migration | `migrations/108_create_partner_centers.sql` |
| Server Actions | `actions/partner-center-actions.ts` |
| Admin page | `apps/admin/app/(app)/partner-centers/page.tsx` |
| Client component | `components/features/admin/partner-centers/PartnerCenterManager.tsx` |
| Sidebar 메뉴 추가 | `components/layout/admin-sidebar.tsx` |

---

## Task 1: DB Migration — partner_centers 테이블 + 초기 데이터

**Files:**
- Create: `migrations/108_create_partner_centers.sql`

- [ ] **Step 1: migration 파일 생성**

`migrations/108_create_partner_centers.sql` 전체 내용:

```sql
-- Migration: 108_create_partner_centers
-- App: admin
-- Created: 2026-06-30

CREATE TABLE IF NOT EXISTS partner_centers (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  region     text        NOT NULL,
  district   text        NOT NULL,
  phone      text        NOT NULL,
  fax        text,
  email      text,
  address    text,
  website    text,
  memo       text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partner_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access on partner_centers"
  ON partner_centers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service role full access on partner_centers"
  ON partner_centers FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX ON partner_centers (region);

-- Initial data: 전국 17개 보조기기센터
INSERT INTO partner_centers (name, region, district, phone, fax, email, address, website) VALUES
  ('중앙보조기기센터',           '서울특별시',     '강북구',       '1670-5529(내선1)',  '02-6944-8212',  'koreanationalatc@gmail.com',      '(01022) 서울특별시 강북구 삼각산로 58 국립재활원 교육행정동 1층',                    'www.knat.go.kr'),
  ('부산광역시보조기기센터',       '부산광역시',     '연제구',       '1670-5529(내선4)',  '051-868-3518',  'bratc@naver.com',                 '(47519) 부산광역시 연제구 중앙대로 1150번길 15 부산광역시장애인종합복지관',            'www.bratc.or.kr'),
  ('대구광역시보조기기센터',       '대구광역시',     '남구',         '1670-5529(내선5)',  '053-650-8344',  'xess-jinhyun@hanmail.net',        '(42400) 대구광역시 남구 성당로50길 33 대구대학교 대명동캠퍼스 평생교육원 1호관1201호', 'datc.daegu.ac.kr'),
  ('인천광역시보조기기센터',       '인천광역시',     '계양구',       '1670-5529(내선3)',  '032-540-8998',  'icatc@naver.com',                 '(21042) 인천광역시 계양구 계양산로 35번길 12-37 인천광역시보조기기센터',              'www.icatc.or.kr'),
  ('광주광역시보조기기센터',       '광주광역시',     '북구',         '1670-5529(내선8)',  '062-233-3004',  'gjat9365@naver.com',              '(61027) 광주광역시 북구 하서로 590 호남권역재활병원 1층',                          'www.gjat.or.kr'),
  ('대전광역시보조기기센터',       '대전광역시',     '중구',         '1670-5529(내선10)', '042-338-2983',  'sr8612@cnuh.co.kr',               '(35015) 대전광역시 중구 문화로 266 대전충청권역의료재활센터 지하1층',                 'www.cnuh.co.kr/yeswecan'),
  ('울산광역시보조기기센터',       '울산광역시',     '남구',         '1670-5529(내선17)', '052-267-5523',  'usatc@naver.com',                 '(44689) 울산광역시 남구 돋질로 131 1층 울산광역시보조기기센터',                     'www.usat.or.kr'),
  ('세종특별자치시보조기기센터',   '세종특별자치시', '세종특별자치시', '1670-5529(내선14)', '044-715-5321',  'sjatc@naver.com',                 '(30100) 세종특별자치시 한누리대로 589, 301호',                                    'www.sjatc.or.kr'),
  ('경기도보조기기센터',           '경기도',        '양주시',        '1670-5529(내선2)',  '031-851-7362',  'atneed@atrac.or.kr',              '(11485) 경기도 양주시 고삼로 43번길 28 104호 경기도보조기기북부센터',                 'www.atrac.or.kr'),
  ('강원특별자치도보조기기센터',   '강원특별자치도', '춘천시',       '1670-5529(내선13)', '033-248-7755',  'gatc2019@naver.com',              '(24227) 강원특별자치도 춘천시 충열로142번길 24-16',                                'www.gatc.or.kr'),
  ('충청북도보조기기센터',         '충청북도',      '청주시',        '1670-5529(내선9)',  '043-265-0402',  'cbat@hanmail.net',                '(28459) 충청북도 청주시 흥덕구 1순환로 438번길 39-17 충북재활의원 3층',               'www.cbat.or.kr'),
  ('충청남도보조기기센터',         '충청남도',      '천안시',        '1670-5529(내선12)', '041-415-2860',  'cnat10582@naver.com',             '(31172) 충청남도 천안시 서북구 월봉로48 믿음관 1층',                               'www.cnat.or.kr'),
  ('전라북도보조기기센터',         '전라북도',      '전주시',        '1670-5529(내선7)',  '063-232-6324',  'ykwoo1987@gmail.com',             '(55046) 전라북도 전주시 완산구 서원로 394, 1층 전라북도보조기기센터',                 'www.jbat.or.kr'),
  ('전라남도보조기기센터',         '전라남도',      '순천시',        '1670-5529(내선16)', '061-740-1507',  'dkfdna1000@suncheon.ac.kr',       '(57997) 전라남도 순천시 제일대학길17(덕월동)',                                    'jnat.or.kr'),
  ('경상북도보조기기센터',         '경상북도',      '경산시',        '1670-5529(내선15)', '053-850-5809',  'gbatc@naver.com',                 '(38453) 경상북도 경산시 진량읍 대구대로 201, 점자도서관 1층 경상북도보조기기센터',     'gbatc.daegu.ac.kr'),
  ('경상남도보조기기센터',         '경상남도',      '창원시',        '1670-5529(내선6)',  '055-237-0065',  'gnatc@naver.com',                 '(51144) 경상남도 창원시 의창구 봉곡로 97번길 85',                                 'www.gnatc.or.kr'),
  ('제주특별자치도보조기기센터',   '제주특별자치도', '제주시',       '1670-5529(내선11)', '064-721-2999',  'jejuat9997@naver.com',            '(63311) 제주특별자치도 제주시 아봉로 433, 제주시각장애인복지관 2층',                  'www.jejuat.or.kr');
```

- [ ] **Step 2: Supabase에 migration 적용**

Supabase 대시보드 SQL Editor에서 위 파일 전체를 실행하거나:

```bash
# Supabase CLI가 있는 경우
npx supabase db push
```

- [ ] **Step 3: 데이터 확인**

Supabase 대시보드 Table Editor → `partner_centers` → 17개 행 확인

- [ ] **Step 4: 커밋**

```bash
git add migrations/108_create_partner_centers.sql
git commit -m "feat(admin): add partner_centers migration with 17 initial centers"
```

---

## Task 2: Server Actions

**Files:**
- Create: `actions/partner-center-actions.ts`

- [ ] **Step 1: 파일 생성**

`actions/partner-center-actions.ts` 전체 내용:

```typescript
"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { withStaffPermission } from "@/lib/utils/with-permission"
import { revalidatePath } from "next/cache"

export interface PartnerCenter {
  id: string
  name: string
  region: string
  district: string
  phone: string
  fax: string | null
  email: string | null
  address: string | null
  website: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export interface PartnerCenterInput {
  name: string
  region: string
  district: string
  phone: string
  fax?: string | null
  email?: string | null
  address?: string | null
  website?: string | null
  memo?: string | null
}

export async function listPartnerCenters(): Promise<{
  success: boolean
  centers?: PartnerCenter[]
  error?: string
}> {
  return withStaffPermission(async () => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await (supabase as any)
        .from("partner_centers")
        .select("*")
        .order("region")
        .order("name")

      if (error) return { success: false, error: "협력기관 목록 조회에 실패했습니다" }
      return { success: true, centers: (data ?? []) as PartnerCenter[] }
    } catch (e) {
      console.error("listPartnerCenters:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}

export async function createPartnerCenter(input: PartnerCenterInput): Promise<{
  success: boolean
  id?: string
  error?: string
}> {
  return withStaffPermission(async () => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await (supabase as any)
        .from("partner_centers")
        .insert(input)
        .select("id")
        .single()

      if (error || !data) return { success: false, error: "협력기관 추가에 실패했습니다" }

      revalidatePath("/partner-centers")
      return { success: true, id: (data as { id: string }).id }
    } catch (e) {
      console.error("createPartnerCenter:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}

export async function updatePartnerCenter(
  id: string,
  input: Partial<PartnerCenterInput>
): Promise<{ success: boolean; error?: string }> {
  return withStaffPermission(async () => {
    try {
      const supabase = createAdminClient()
      const { error } = await (supabase as any)
        .from("partner_centers")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) return { success: false, error: "협력기관 수정에 실패했습니다" }

      revalidatePath("/partner-centers")
      return { success: true }
    } catch (e) {
      console.error("updatePartnerCenter:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}

export async function deletePartnerCenter(id: string): Promise<{
  success: boolean
  error?: string
}> {
  return withStaffPermission(async () => {
    try {
      const supabase = createAdminClient()
      const { error } = await (supabase as any)
        .from("partner_centers")
        .delete()
        .eq("id", id)

      if (error) return { success: false, error: "협력기관 삭제에 실패했습니다" }

      revalidatePath("/partner-centers")
      return { success: true }
    } catch (e) {
      console.error("deletePartnerCenter:", e)
      return { success: false, error: "예상치 못한 오류가 발생했습니다" }
    }
  })
}
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
cd apps/admin && npx tsc --noEmit 2>&1 | grep partner
```

오류 없으면 OK. `Cannot find module` 오류가 나면 경로 확인.

- [ ] **Step 3: 커밋**

```bash
git add actions/partner-center-actions.ts
git commit -m "feat(admin): add partner-center server actions (CRUD)"
```

---

## Task 3: 페이지 + 클라이언트 컴포넌트

**Files:**
- Create: `apps/admin/app/(app)/partner-centers/page.tsx`
- Create: `components/features/admin/partner-centers/PartnerCenterManager.tsx`

- [ ] **Step 1: 서버 컴포넌트 페이지 생성**

`apps/admin/app/(app)/partner-centers/page.tsx`:

```typescript
import { listPartnerCenters } from "@/actions/partner-center-actions"
import { PartnerCenterManager } from "@/components/features/admin/partner-centers/PartnerCenterManager"
import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"

export default async function PartnerCentersPage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) redirect("/")

  const result = await listPartnerCenters()
  const centers = result.success ? result.centers ?? [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">협력기관 연락망</h1>
        <p className="text-muted-foreground">전국 보조기기센터 연락처 및 협력 정보를 관리합니다</p>
      </div>
      <PartnerCenterManager initialCenters={centers} />
    </div>
  )
}
```

- [ ] **Step 2: 클라이언트 컴포넌트 생성**

`components/features/admin/partner-centers/PartnerCenterManager.tsx` 전체 내용:

```typescript
"use client"

import { useState, useMemo } from "react"
import {
  createPartnerCenter,
  updatePartnerCenter,
  deletePartnerCenter,
  type PartnerCenter,
  type PartnerCenterInput,
} from "@/actions/partner-center-actions"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react"

const EMPTY_INPUT: PartnerCenterInput = {
  name: "",
  region: "",
  district: "",
  phone: "",
  fax: "",
  email: "",
  address: "",
  website: "",
  memo: "",
}

interface Props {
  initialCenters: PartnerCenter[]
}

export function PartnerCenterManager({ initialCenters }: Props) {
  const [centers, setCenters] = useState<PartnerCenter[]>(initialCenters)
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PartnerCenter | null>(null)
  const [form, setForm] = useState<PartnerCenterInput>(EMPTY_INPUT)
  const [deleteTarget, setDeleteTarget] = useState<PartnerCenter | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const regions = useMemo(
    () => Array.from(new Set(centers.map((c) => c.region))).sort(),
    [centers]
  )

  const filtered = useMemo(
    () => (regionFilter === "all" ? centers : centers.filter((c) => c.region === regionFilter)),
    [centers, regionFilter]
  )

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_INPUT)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(center: PartnerCenter) {
    setEditTarget(center)
    setForm({
      name: center.name,
      region: center.region,
      district: center.district,
      phone: center.phone,
      fax: center.fax ?? "",
      email: center.email ?? "",
      address: center.address ?? "",
      website: center.website ?? "",
      memo: center.memo ?? "",
    })
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.region || !form.district || !form.phone) {
      setError("기관명, 광역시도, 시군구, 전화번호는 필수입니다")
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editTarget) {
        const res = await updatePartnerCenter(editTarget.id, form)
        if (!res.success) { setError(res.error ?? "수정 실패"); return }
        setCenters((prev) =>
          prev.map((c) =>
            c.id === editTarget.id ? { ...c, ...form, updated_at: new Date().toISOString() } : c
          )
        )
      } else {
        const res = await createPartnerCenter(form)
        if (!res.success || !res.id) { setError(res.error ?? "추가 실패"); return }
        setCenters((prev) => [
          ...prev,
          { ...form, id: res.id!, fax: form.fax ?? null, email: form.email ?? null,
            address: form.address ?? null, website: form.website ?? null,
            memo: form.memo ?? null, created_at: new Date().toISOString(),
            updated_at: new Date().toISOString() },
        ])
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const res = await deletePartnerCenter(deleteTarget.id)
    if (res.success) {
      setCenters((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="지역 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          기관 추가
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>기관명</TableHead>
              <TableHead>광역시도</TableHead>
              <TableHead>전화</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>홈페이지</TableHead>
              <TableHead className="w-20 text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  등록된 협력기관이 없습니다
                </TableCell>
              </TableRow>
            )}
            {filtered.map((center) => (
              <TableRow
                key={center.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => openEdit(center)}
              >
                <TableCell className="font-medium">{center.name}</TableCell>
                <TableCell>{center.region}</TableCell>
                <TableCell>{center.phone}</TableCell>
                <TableCell>{center.email ?? "-"}</TableCell>
                <TableCell>
                  {center.website ? (
                    <a
                      href={center.website.startsWith("http") ? center.website : `https://${center.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      {center.website}
                    </a>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(center)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(center)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 추가/수정 모달 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "협력기관 수정" : "협력기관 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>기관명 *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>광역시도 *</Label>
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>시군구 *</Label>
                <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>전화번호 *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>팩스</Label>
                <Input value={form.fax ?? ""} onChange={(e) => setForm({ ...form, fax: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>이메일</Label>
                <Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>주소</Label>
                <Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>홈페이지</Label>
                <Input value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="www.example.or.kr" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>협력 메모</Label>
                <Textarea
                  value={form.memo ?? ""}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  rows={3}
                  placeholder="협력 내용, 특이사항 등"
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>취소</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : editTarget ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>협력기관 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong>을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript 오류 확인**

```bash
cd apps/admin && npx tsc --noEmit 2>&1 | grep -E "partner|PartnerCenter"
```

오류 없으면 OK.

- [ ] **Step 4: 커밋**

```bash
git add apps/admin/app/\(app\)/partner-centers/page.tsx
git add components/features/admin/partner-centers/PartnerCenterManager.tsx
git commit -m "feat(admin): add partner-centers page and PartnerCenterManager component"
```

---

## Task 4: 사이드바 메뉴 추가

**Files:**
- Modify: `components/layout/admin-sidebar.tsx`

- [ ] **Step 1: import에 Building2 아이콘 추가 + NAV_ENTRIES에 항목 추가**

`components/layout/admin-sidebar.tsx` 상단 import를 수정:

```typescript
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarCheck,
  Settings,
  Globe,
  Sparkles,
  MessageSquare,
  Bot,
  ClipboardList,
  Building2,      // 추가
} from "lucide-react";
```

`NAV_ENTRIES` 배열에서 `업무` 섹션 앞에 항목 추가:

```typescript
const NAV_ENTRIES: NavEntry[] = [
  { type: "item", href: "/", label: "앱 목록", icon: LayoutDashboard },

  { type: "section", label: "콘텐츠" },
  { type: "item", href: "/notices-management", label: "웹 관리", icon: Globe },
  { type: "item", href: "/schedule", label: "일정 관리", icon: Calendar },
  { type: "item", href: "/appointments", label: "예약 관리", icon: CalendarCheck },
  { type: "item", href: "/partner-centers", label: "협력기관 연락망", icon: Building2 },  // 추가

  { type: "section", label: "업무" },
  { type: "item", href: "/work-tasks", label: "업무 관리", icon: ClipboardList },
  { type: "item", href: "/messenger", label: "업무 메신저", icon: MessageSquare },
  { type: "item", href: "/agent-chat", label: "AI 업무 도우미", icon: Bot },

  { type: "section", label: "시스템" },
  { type: "item", href: "/users", label: "사용자 관리", icon: Users, managerOnly: true },
  { type: "item", href: "/settings", label: "설정", icon: Settings },
];
```

- [ ] **Step 2: 빌드 확인**

```bash
cd apps/admin && npx tsc --noEmit 2>&1 | head -20
```

오류 없으면 OK.

- [ ] **Step 3: 커밋**

```bash
git add components/layout/admin-sidebar.tsx
git commit -m "feat(admin): add 협력기관 연락망 to sidebar nav"
```

---

## Task 5: 브라우저 동작 검증

- [ ] **Step 1: dev 서버 시작**

```bash
pnpm dev --filter admin
```

- [ ] **Step 2: 브라우저에서 확인**

`http://localhost:3001/partner-centers` (또는 admin 앱 포트) 접속:

1. 17개 센터가 테이블에 표시되는지 확인
2. 지역 필터 드롭다운이 동작하는지 확인
3. 행 클릭 → 수정 모달이 열리는지 확인
4. 메모 입력 후 수정 저장 → 재조회 시 반영되는지 확인
5. 기관 추가 → 17+1 = 18개가 되는지 확인
6. 삭제 → 확인 다이얼로그 → 삭제 후 목록에서 제거되는지 확인
7. 사이드바에 "협력기관 연락망" 메뉴가 표시되는지 확인

- [ ] **Step 3: 최종 커밋 (필요 시 수정 사항 반영)**

```bash
git add -p
git commit -m "fix(admin): partner-centers browser verification fixes"
```
