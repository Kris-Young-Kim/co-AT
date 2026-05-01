'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <div className="fixed top-4 right-4 no-print z-10">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-md"
      >
        <Printer className="h-4 w-4" />
        PDF 저장 / 인쇄
      </button>
    </div>
  )
}
