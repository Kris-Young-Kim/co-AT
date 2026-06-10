"use client"

import { useState, useTransition } from "react"
import { PlusCircle, Pencil, Trash2, Eye, EyeOff, X, Check } from "lucide-react"
import { createBanner, updateBanner, deleteBanner } from "@/actions/banner-actions"
import type { Banner, BannerInput } from "@/actions/banner-actions"
import { useRouter } from "next/navigation"

interface BannerManagerProps {
  initialBanners: Banner[]
}

const EMPTY_FORM: BannerInput = {
  title: "",
  content: "",
  image_url: "",
  link_url: "",
  link_label: "자세히 보기",
  is_active: true,
  start_at: null,
  end_at: null,
}

export function BannerManager({ initialBanners }: BannerManagerProps) {
  const router = useRouter()
  const [banners, setBanners] = useState(initialBanners)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<BannerInput>(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditing(null)
    setCreating(true)
    setError(null)
  }

  function openEdit(banner: Banner) {
    setForm({
      title: banner.title,
      content: banner.content ?? "",
      image_url: banner.image_url ?? "",
      link_url: banner.link_url ?? "",
      link_label: banner.link_label,
      is_active: banner.is_active,
      start_at: banner.start_at,
      end_at: banner.end_at,
    })
    setEditing(banner)
    setCreating(false)
    setError(null)
  }

  function closeForm() {
    setCreating(false)
    setEditing(null)
    setError(null)
  }

  function handleSave() {
    const input: BannerInput = {
      ...form,
      content:   form.content   || null,
      image_url: form.image_url || null,
      link_url:  form.link_url  || null,
      start_at:  form.start_at  || null,
      end_at:    form.end_at    || null,
    }

    startTransition(async () => {
      if (editing) {
        const res = await updateBanner(editing.id, input)
        if (!res.success) { setError(res.error ?? "수정 실패"); return }
        setBanners((prev) => prev.map((b) => b.id === editing.id ? { ...b, ...input } : b))
      } else {
        const res = await createBanner(input)
        if (!res.success) { setError(res.error ?? "생성 실패"); return }
        router.refresh()
      }
      closeForm()
    })
  }

  function handleDelete(id: string) {
    if (!confirm("배너를 삭제하시겠습니까?")) return
    startTransition(async () => {
      const res = await deleteBanner(id)
      if (!res.success) { setError(res.error ?? "삭제 실패"); return }
      setBanners((prev) => prev.filter((b) => b.id !== id))
    })
  }

  function handleToggleActive(banner: Banner) {
    startTransition(async () => {
      const res = await updateBanner(banner.id, { is_active: !banner.is_active })
      if (!res.success) { setError(res.error ?? "수정 실패"); return }
      setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
    })
  }

  const isFormOpen = creating || !!editing

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Form */}
      {isFormOpen && (
        <div className="border rounded-xl bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">{editing ? "배너 수정" : "새 배너 추가"}</h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="배너 제목"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
              <textarea
                value={form.content ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={3}
                placeholder="배너 본문 내용 (선택)"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
              <input
                value={form.image_url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..."
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">링크 URL</label>
              <input
                value={form.link_url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                placeholder="https://..."
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">링크 버튼 텍스트</label>
              <input
                value={form.link_label ?? "자세히 보기"}
                onChange={(e) => setForm((f) => ({ ...f, link_label: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">노출 시작일</label>
              <input
                type="datetime-local"
                value={form.start_at ? form.start_at.slice(0, 16) : ""}
                onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">노출 종료일</label>
              <input
                type="datetime-local"
                value={form.end_at ? form.end_at.slice(0, 16) : ""}
                onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active ?? true}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">활성화</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isPending || !form.title}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {isPending ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={closeForm}
              className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!isFormOpen && (
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 w-full justify-center"
        >
          <PlusCircle className="h-4 w-4" />
          새 배너 추가
        </button>
      )}

      {/* Banner list */}
      <div className="space-y-3">
        {banners.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">등록된 배너가 없습니다</p>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className="flex items-start gap-4 border rounded-xl bg-white p-4 shadow-sm"
            >
              {banner.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="h-16 w-24 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 truncate">{banner.title}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${banner.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {banner.is_active ? "활성" : "비활성"}
                  </span>
                </div>
                {banner.content && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{banner.content}</p>
                )}
                <div className="mt-1 text-xs text-gray-400 flex gap-3 flex-wrap">
                  {banner.start_at && <span>시작: {new Date(banner.start_at).toLocaleDateString("ko-KR")}</span>}
                  {banner.end_at && <span>종료: {new Date(banner.end_at).toLocaleDateString("ko-KR")}</span>}
                  {banner.link_url && <span className="truncate max-w-[160px]">링크: {banner.link_url}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleActive(banner)}
                  title={banner.is_active ? "비활성화" : "활성화"}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  {banner.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => openEdit(banner)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
