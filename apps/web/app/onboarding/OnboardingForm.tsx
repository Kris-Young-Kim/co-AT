"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { completePortalProfile } from "@/actions/portal-actions"
import { Loader2 } from "lucide-react"

export function OnboardingForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !birthDate) return
    setError(null)
    startTransition(async () => {
      const result = await completePortalProfile(name.trim(), birthDate)
      if (!result.success) {
        setError(result.error ?? "저장에 실패했습니다")
        return
      }
      router.push("/mypage")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          이름 <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          required
          disabled={isPending}
          className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          생년월일 <span className="text-destructive">*</span>
        </label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          required
          disabled={isPending}
          className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !name.trim() || !birthDate}
        className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? "저장 중..." : "저장하고 시작하기"}
      </button>
    </form>
  )
}
