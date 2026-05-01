'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState } from 'react'
import { Search } from 'lucide-react'

export function ClientSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get('q') ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams()
      if (value.trim()) params.set('q', value.trim())
      router.push(`/clients?${params.toString()}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="이름 또는 생년월일(YYYY-MM-DD) 검색"
          className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        검색
      </button>
    </form>
  )
}
