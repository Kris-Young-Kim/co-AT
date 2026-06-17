'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState, useRef } from 'react'
import { Search, ScanLine, X } from 'lucide-react'

export function ClientSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const [scanMode, setScanMode] = useState(false)
  const [scanValue, setScanValue] = useState('')
  const scanInputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams()
      if (value.trim()) params.set('q', value.trim())
      router.push(`/clients?${params.toString()}`)
    })
  }

  function handleScanKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && scanValue.trim()) {
      const token = scanValue.trim()
      setScanValue('')
      startTransition(() => {
        router.push(`/clients?qr=${encodeURIComponent(token)}`)
      })
    }
    if (e.key === 'Escape') {
      setScanMode(false)
      setScanValue('')
    }
  }

  function toggleScanMode() {
    setScanMode(prev => {
      if (!prev) {
        // focus scan input after render
        setTimeout(() => scanInputRef.current?.focus(), 0)
      }
      return !prev
    })
    setScanValue('')
  }

  return (
    <div className="space-y-2">
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
        <button
          type="button"
          onClick={toggleScanMode}
          title="QR 스캔으로 검색"
          className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
            scanMode
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <ScanLine className="h-4 w-4" />
        </button>
      </form>

      {scanMode && (
        <div className="flex items-center gap-2 p-3 rounded-md border border-blue-200 bg-blue-50">
          <ScanLine className="h-4 w-4 text-blue-500 shrink-0" />
          <input
            ref={scanInputRef}
            type="text"
            value={scanValue}
            onChange={e => setScanValue(e.target.value)}
            onKeyDown={handleScanKeyDown}
            placeholder="대상자 QR 스캔 또는 토큰 입력 후 Enter"
            className="flex-1 bg-transparent text-sm text-blue-800 placeholder:text-blue-400 focus:outline-none"
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => { setScanMode(false); setScanValue('') }}
            className="text-blue-400 hover:text-blue-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
