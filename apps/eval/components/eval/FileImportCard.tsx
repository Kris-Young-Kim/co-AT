'use client'

import { useRef, useState, useTransition } from 'react'
import { CheckCircle, XCircle, Upload, FileSpreadsheet } from 'lucide-react'
import type { ImportResult } from '@/actions/import-actions'

interface Props {
  label: string
  description: string
  action: (formData: FormData) => Promise<ImportResult>
}

export function FileImportCard({ label, description, action }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSelectFile(f: File | null) {
    if (!f) return
    setFile(f)
    setResult(null)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) onSelectFile(f)
  }

  function onImport() {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    startTransition(async () => {
      const res = await action(fd)
      setResult(res)
    })
  }

  return (
    <div className="border rounded-lg p-6 bg-white flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">{label}</h2>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {file ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
            <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />
            <span className="truncate max-w-[180px]">{file.name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <Upload className="h-5 w-5" />
            <span className="text-xs">.xlsx / .csv 파일을 올려주세요</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={e => onSelectFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {result && (
        <div className={`rounded-md px-3 py-2 text-sm ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {result.success ? (
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                추가 <strong>{result.rowsAdded}</strong>건 &middot; 건너뜀 <strong>{result.rowsSkipped}</strong>건
                {result.rowsFailed > 0 && <> &middot; 오류 <strong>{result.rowsFailed}</strong>건</>}
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{result.error ?? '가져오기 실패'}</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onImport}
        disabled={!file || isPending}
        className="w-full py-2 px-4 rounded-md text-sm font-medium transition-colors
          bg-gray-900 text-white hover:bg-gray-700
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? '가져오는 중…' : '가져오기 실행'}
      </button>
    </div>
  )
}
