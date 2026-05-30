'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@co-at/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@co-at/ui/dialog'
import { Input } from '@co-at/ui/input'
import { Label } from '@co-at/ui/label'
import { Textarea } from '@co-at/ui/textarea'
import { Badge } from '@co-at/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@co-at/ui/tabs'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { PromotionActivity, PromotionMonthly } from '@/stats/actions/promotion-actions'
import {
  createPromotionActivity,
  updatePromotionActivity,
  deletePromotionActivity,
  upsertPromotionMonthly,
} from '@/stats/actions/promotion-actions'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

interface Props {
  year: number
  activities: PromotionActivity[]
  monthly: PromotionMonthly[]
}

// ── Activity edit dialog ──────────────────────────────────────────────────────

type ActivityForm = Omit<PromotionActivity, 'id'>

function emptyActivity(year: number): ActivityForm {
  return {
    year,
    activity_date: null,
    content: '',
    total_count: 1,
    promo_material_type: null,
    promo_material_count: null,
    media_type: null,
    media_count: null,
    event_type: null,
    event_count: null,
    event_attendees: null,
    other_type: null,
    other_count: null,
    other_times: null,
    notes: null,
    sort_order: 0,
  }
}

function ActivityDialog({
  open,
  onClose,
  initial,
  id,
  year,
}: {
  open: boolean
  onClose: () => void
  initial: ActivityForm | null
  id?: string
  year: number
}) {
  const router = useRouter()
  const [form, setForm] = useState<ActivityForm>(initial ?? emptyActivity(year))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function num(v: string) { const n = parseInt(v); return isNaN(n) ? null : n }
  function float(v: string) { const n = parseFloat(v); return isNaN(n) ? null : n }

  async function handleSave() {
    if (!form.content.trim()) { setError('내용을 입력하세요'); return }
    setSaving(true)
    const res = id
      ? await updatePromotionActivity(id, form)
      : await createPromotionActivity(form)
    setSaving(false)
    if (!res.success) { setError(res.error ?? '저장 실패'); return }
    router.refresh()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{id ? '홍보 활동 수정' : '홍보 활동 추가'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <Label>내용 *</Label>
            <Input value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <div>
            <Label>일정</Label>
            <Input type="date" value={form.activity_date ?? ''} onChange={e => setForm(f => ({ ...f, activity_date: e.target.value || null }))} />
          </div>
          <div>
            <Label>총 합계(건)</Label>
            <Input type="number" value={form.total_count ?? ''} onChange={e => setForm(f => ({ ...f, total_count: num(e.target.value) }))} />
          </div>

          <div className="col-span-2 border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">홍보물</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>유형</Label><Input placeholder="예: 포스터, 리플렛, 책자" value={form.promo_material_type ?? ''} onChange={e => setForm(f => ({ ...f, promo_material_type: e.target.value || null }))} /></div>
              <div><Label>건</Label><Input type="number" value={form.promo_material_count ?? ''} onChange={e => setForm(f => ({ ...f, promo_material_count: num(e.target.value) }))} /></div>
            </div>
          </div>

          <div className="col-span-2 border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">매체 홍보</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>유형</Label><Input placeholder="예: SNS, 이메일, 문자" value={form.media_type ?? ''} onChange={e => setForm(f => ({ ...f, media_type: e.target.value || null }))} /></div>
              <div><Label>건</Label><Input type="number" value={form.media_count ?? ''} onChange={e => setForm(f => ({ ...f, media_count: num(e.target.value) }))} /></div>
            </div>
          </div>

          <div className="col-span-2 border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">행사</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>유형</Label><Input placeholder="예: 홍보부스, 사업설명회" value={form.event_type ?? ''} onChange={e => setForm(f => ({ ...f, event_type: e.target.value || null }))} /></div>
              <div><Label>건</Label><Input type="number" value={form.event_count ?? ''} onChange={e => setForm(f => ({ ...f, event_count: num(e.target.value) }))} /></div>
              <div><Label>명(참석인원)</Label><Input type="number" value={form.event_attendees ?? ''} onChange={e => setForm(f => ({ ...f, event_attendees: num(e.target.value) }))} /></div>
            </div>
          </div>

          <div className="col-span-2 border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">기타</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>유형</Label><Input placeholder="예: 직접전달, 이메일발송" value={form.other_type ?? ''} onChange={e => setForm(f => ({ ...f, other_type: e.target.value || null }))} /></div>
              <div><Label>건</Label><Input type="number" value={form.other_count ?? ''} onChange={e => setForm(f => ({ ...f, other_count: num(e.target.value) }))} /></div>
              <div><Label>회</Label><Input type="number" value={form.other_times ?? ''} onChange={e => setForm(f => ({ ...f, other_times: num(e.target.value) }))} /></div>
            </div>
          </div>

          <div className="col-span-2 border-t pt-3">
            <Label>비고(상세 추진 내용)</Label>
            <Textarea rows={3} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))} />
          </div>

          <div>
            <Label>정렬 순서</Label>
            <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: num(e.target.value) ?? 0 }))} />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중…' : '저장'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Monthly analytics edit dialog ─────────────────────────────────────────────

function MonthlyDialog({
  open,
  onClose,
  year,
  month,
  initial,
}: {
  open: boolean
  onClose: () => void
  year: number
  month: number
  initial: PromotionMonthly | null
}) {
  const router = useRouter()
  type F = Partial<Omit<PromotionMonthly, 'id' | 'year' | 'month'>>
  const [form, setForm] = useState<F>({
    homepage_posts: initial?.homepage_posts ?? null,
    facebook_posts: initial?.facebook_posts ?? null,
    kakao_posts: initial?.kakao_posts ?? null,
    instagram_posts: initial?.instagram_posts ?? null,
    blog_posts: initial?.blog_posts ?? null,
    hp_notice: initial?.hp_notice ?? null,
    hp_gallery: initial?.hp_gallery ?? null,
    hp_gov_support: initial?.hp_gov_support ?? null,
    hp_online_inquiry: initial?.hp_online_inquiry ?? null,
    hp_visitor_total: initial?.hp_visitor_total ?? null,
    hp_daily_avg: initial?.hp_daily_avg ?? null,
    hp_monthly_avg: initial?.hp_monthly_avg ?? null,
    hp_visitor_ratio: initial?.hp_visitor_ratio ?? null,
    ig_story: initial?.ig_story ?? null,
    ig_post: initial?.ig_post ?? null,
    ig_online_inquiry: initial?.ig_online_inquiry ?? null,
    ig_follower_ratio: initial?.ig_follower_ratio ?? null,
    ig_non_follower_ratio: initial?.ig_non_follower_ratio ?? null,
    ig_total_views: initial?.ig_total_views ?? null,
    ig_top_post: initial?.ig_top_post ?? null,
  })
  const [saving, setSaving] = useState(false)

  function num(v: string) { const n = parseInt(v); return isNaN(n) ? null : n }
  function flt(v: string) { const n = parseFloat(v); return isNaN(n) ? null : n }

  async function handleSave() {
    setSaving(true)
    const res = await upsertPromotionMonthly(year, month, form)
    setSaving(false)
    if (res.success) { router.refresh(); onClose() }
  }

  const row = (label: string, key: keyof F, type: 'int' | 'float' | 'text' = 'int') => (
    <div key={key}>
      <Label className="text-xs">{label}</Label>
      <Input
        type={type === 'text' ? 'text' : 'number'}
        step={type === 'float' ? '0.1' : undefined}
        value={(form[key] as string | number | null) ?? ''}
        onChange={e => setForm(f => ({ ...f, [key]: type === 'text' ? (e.target.value || null) : type === 'float' ? flt(e.target.value) : num(e.target.value) }))}
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{month}월 매체 운영 기록</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">SNS 게시물 수</p>
            <div className="grid grid-cols-3 gap-3">
              {row('홈페이지', 'homepage_posts')}
              {row('페이스북', 'facebook_posts')}
              {row('카카오톡', 'kakao_posts')}
              {row('인스타그램', 'instagram_posts')}
              {row('블로그', 'blog_posts')}
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">홈페이지 상세</p>
            <div className="grid grid-cols-2 gap-3">
              {row('공지사항', 'hp_notice')}
              {row('활동갤러리', 'hp_gallery')}
              {row('정부지원사업안내', 'hp_gov_support')}
              {row('온라인문의', 'hp_online_inquiry')}
              {row('방문자명수', 'hp_visitor_total')}
              {row('일평균 방문자수', 'hp_daily_avg', 'float')}
              {row('월평균 방문자수', 'hp_monthly_avg', 'float')}
              {row('비율(%)', 'hp_visitor_ratio', 'float')}
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">인스타그램 상세</p>
            <div className="grid grid-cols-2 gap-3">
              {row('스토리', 'ig_story')}
              {row('게시글', 'ig_post')}
              {row('온라인 문의', 'ig_online_inquiry')}
              {row('팔로워 조회(%)', 'ig_follower_ratio', 'float')}
              {row('미팔로워 조회(%)', 'ig_non_follower_ratio', 'float')}
              {row('전체 조회', 'ig_total_views')}
              {row('가장 많이 조회한 게시물', 'ig_top_post', 'text')}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중…' : '저장'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PromotionRecordList({ year, activities, monthly }: Props) {
  const router = useRouter()
  const [activityDialog, setActivityDialog] = useState<{ open: boolean; item: PromotionActivity | null }>({ open: false, item: null })
  const [monthlyDialog, setMonthlyDialog] = useState<{ open: boolean; month: number }>({ open: false, month: 1 })
  const [deleting, setDeleting] = useState<string | null>(null)

  const monthlyMap = Object.fromEntries(monthly.map(m => [m.month, m]))

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    setDeleting(id)
    await deletePromotionActivity(id)
    setDeleting(null)
    router.refresh()
  }

  function hasMonthlyData(m: PromotionMonthly) {
    return [m.homepage_posts, m.facebook_posts, m.kakao_posts, m.instagram_posts, m.blog_posts].some(v => v !== null)
  }

  return (
    <>
      <Tabs defaultValue="activities">
        <TabsList className="mb-4">
          <TabsTrigger value="activities">홍보 활동 목록 (Sheet 4)</TabsTrigger>
          <TabsTrigger value="media">매체 운영 기록 (Sheet 4-1)</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Individual activities ── */}
        <TabsContent value="activities">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setActivityDialog({ open: true, item: null })}>
              <Plus className="h-4 w-4 mr-1" /> 활동 추가
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left">순서</th>
                  <th className="px-3 py-2 text-left">내용</th>
                  <th className="px-3 py-2 text-left">일정</th>
                  <th className="px-3 py-2 text-right">합계(건)</th>
                  <th className="px-3 py-2 text-left">홍보물</th>
                  <th className="px-3 py-2 text-left">매체홍보</th>
                  <th className="px-3 py-2 text-left">행사</th>
                  <th className="px-3 py-2 text-left">기타</th>
                  <th className="px-3 py-2 text-center">작업</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">등록된 홍보 활동이 없습니다</td></tr>
                )}
                {activities.map((a, i) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium max-w-[200px] truncate" title={a.content}>{a.content}</td>
                    <td className="px-3 py-2 text-gray-500">{a.activity_date ?? '-'}</td>
                    <td className="px-3 py-2 text-right">{a.total_count ?? '-'}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {a.promo_material_type ? `${a.promo_material_type} ${a.promo_material_count ?? ''}건` : '-'}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {a.media_type ? `${a.media_type} ${a.media_count ?? ''}건` : '-'}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {a.event_type ? `${a.event_type} ${a.event_count ?? ''}건${a.event_attendees ? ` / ${a.event_attendees}명` : ''}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {a.other_type ? `${a.other_type} ${a.other_count ?? ''}건` : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setActivityDialog({ open: true, item: a })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" disabled={deleting === a.id} onClick={() => handleDelete(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Tab 2: Monthly media analytics ── */}
        <TabsContent value="media">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left">월</th>
                  <th className="px-3 py-2 text-right">홈페이지</th>
                  <th className="px-3 py-2 text-right">페이스북</th>
                  <th className="px-3 py-2 text-right">카카오톡</th>
                  <th className="px-3 py-2 text-right">인스타그램</th>
                  <th className="px-3 py-2 text-right">블로그</th>
                  <th className="px-3 py-2 text-right">홈페이지 방문자</th>
                  <th className="px-3 py-2 text-right">인스타 전체 조회</th>
                  <th className="px-3 py-2 text-center">상태</th>
                  <th className="px-3 py-2 text-center">입력</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map((label, i) => {
                  const m = i + 1
                  const data = monthlyMap[m] ?? null
                  const filled = data !== null && hasMonthlyData(data)
                  return (
                    <tr key={m} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{label}</td>
                      <td className="px-3 py-2 text-right">{data?.homepage_posts ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{data?.facebook_posts ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{data?.kakao_posts ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{data?.instagram_posts ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{data?.blog_posts ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{data?.hp_visitor_total?.toLocaleString() ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{data?.ig_total_views?.toLocaleString() ?? '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant={filled ? 'default' : 'secondary'} className="text-xs">
                          {filled ? '입력됨' : '미입력'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonthlyDialog({ open: true, month: m })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ActivityDialog
        open={activityDialog.open}
        onClose={() => setActivityDialog({ open: false, item: null })}
        initial={activityDialog.item ? (({ id, ...rest }) => rest)(activityDialog.item) : null}
        id={activityDialog.item?.id}
        year={year}
      />
      {monthlyDialog.open && (
        <MonthlyDialog
          open
          onClose={() => setMonthlyDialog({ open: false, month: 1 })}
          year={year}
          month={monthlyDialog.month}
          initial={monthlyMap[monthlyDialog.month] ?? null}
        />
      )}
    </>
  )
}
