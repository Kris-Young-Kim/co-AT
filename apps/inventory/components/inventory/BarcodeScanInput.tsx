'use client'

import { useRef, useState } from 'react'
import { Search } from 'lucide-react'

interface BarcodeScanInputProps {
  onScan: (value: string) => void
  placeholder?: string
}

export function BarcodeScanInput({
  onScan,
  placeholder = '바코드 스캔 또는 입력 후 Enter',
}: BarcodeScanInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) {
            onScan(value.trim())
            setValue('')
          }
        }}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
