'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { importInventoryItems } from '@/actions/inventory-actions'
import type { ImportParseResult, ParsedRow } from '@/inventory/lib/import-types'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'

type Step = 'upload' | 'preview' | 'done'

const FIELD_LABELS: Record<string, string> = {
  name: '기기명',
  asset_code: '자산코드',
  manufacturer: '제조사',
  model: '모델명',
  category: '분류',
  purchase_date: '구입일자',
  purchase_price: '구입가격',
  status: '상태',
  barcode: '바코드',
}

export function DeviceImportClient() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isParsing, startParse] = useTransition()
  const [isImporting, startImport] = useTransition()
  const [importResult, setImportResult] = useState<{
    inserted: number; skipped: number; errors: string[]
  } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setParseError(null)
  }

  function handleUpload() {
    if (!selectedFile) return
    startParse(async () => {
      const fd = new FormData()
      fd.append('file', selectedFile)
      try {
        const res = await fetch('/api/inventory/import', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) {
          setParseError(json.error ?? '파싱 오류')
          return
        }
        setParseResult(json as ImportParseResult)
        setStep('preview')
      } catch {
        setParseError('파일을 읽는 중 오류가 발생했습니다')
      }
    })
  }

  function handleImport() {
    if (!parseResult) return
    startImport(async () => {
      const result = await importInventoryItems(parseResult.rows as Parameters<typeof importInventoryItems>[0])
      setImportResult(result)
      setStep('done')
    })
  }

  return (
    <div className="max-w-4xl">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8 text-sm">
        {(['upload', 'preview', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${step === s ? 'bg-blue-600 text-white' :
                i < ['upload', 'preview', 'done'].indexOf(step) ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-500'}`}>
              {i + 1}
            </div>
            <span className={step === s ? 'font-medium text-gray-900' : 'text-gray-400'}>
              {s === 'upload' ? '파일 선택' : s === 'preview' ? '미리보기' : '완료'}
            </span>
            {i < 2 && <div className="w-8 h-px bg-gray-300 ml-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-base font-medium text-gray-700 mb-1">
              자산관리대장 Excel 파일을 선택하세요
            </p>
            <p className="text-sm text-gray-500">.xlsx, .xls 형식 지원</p>
            {selectedFile && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm">
                <FileSpreadsheet className="h-4 w-4" />
                {selectedFile.name}
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Column guide */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <p className="font-medium text-gray-700 mb-2">인식되는 열 이름</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-gray-600">
              {Object.entries(FIELD_LABELS).map(([key, label]) => (
                <span key={key}>· {label}</span>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              첫 번째 행을 헤더로 읽습니다. 위 이름과 정확히 일치하는 열만 가져옵니다.
            </p>
          </div>

          {parseError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {parseError}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isParsing}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> 분석 중...</>
            ) : (
              <><Upload className="h-4 w-4" /> 파일 분석</>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && parseResult && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="flex flex-wrap gap-4 p-4 bg-blue-50 rounded-lg text-sm">
            <div>
              <span className="text-gray-500">감지된 행: </span>
              <span className="font-semibold text-gray-900">{parseResult.total}개</span>
            </div>
            <div>
              <span className="text-gray-500">인식된 열: </span>
              <span className="font-semibold text-blue-700">
                {parseResult.mappedFields.map((f: string) => FIELD_LABELS[f] ?? f).join(', ')}
              </span>
            </div>
            {parseResult.unmapped.length > 0 && (
              <div>
                <span className="text-gray-500">무시된 열: </span>
                <span className="text-gray-400">{parseResult.unmapped.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Preview table */}
          <div className="overflow-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {parseResult.mappedFields.map((f: string) => (
                    <th key={f} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {FIELD_LABELS[f] ?? f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(parseResult.rows as ParsedRow[]).slice(0, 10).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {parseResult.mappedFields.map((f: string) => (
                      <td key={f} className="px-3 py-2 text-gray-700 max-w-[160px] truncate">
                        {(row as Record<string, string>)[f] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parseResult.total > 10 && (
            <p className="text-xs text-gray-400 text-center">
              처음 10행 미리보기 (전체 {parseResult.total}행)
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('upload')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" /> 다시 선택
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || parseResult.total === 0}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> 가져오는 중...</>
              ) : (
                <><Upload className="h-4 w-4" /> {parseResult.total}개 가져오기</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 'done' && importResult && (
        <div className="space-y-5">
          <div className={`flex items-start gap-4 p-5 rounded-xl ${
            importResult.errors.length === 0 ? 'bg-green-50' : 'bg-yellow-50'
          }`}>
            {importResult.errors.length === 0 ? (
              <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-500 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold text-gray-900 mb-1">
                {importResult.errors.length === 0 ? '가져오기 완료' : '가져오기 부분 완료'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-green-700">{importResult.inserted}개</span> 등록됨
                {importResult.skipped > 0 && (
                  <span className="ml-2 text-gray-400">· {importResult.skipped}개 건너뜀 (기기명 없음)</span>
                )}
              </p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-700 mb-2">오류 내역</p>
              <ul className="text-xs text-red-600 space-y-1">
                {importResult.errors.map((e, i) => <li key={i}>· {e}</li>)}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/devices')}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              기기 목록으로
            </button>
            <button
              onClick={() => { setStep('upload'); setParseResult(null); setImportResult(null); setSelectedFile(null) }}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              추가 가져오기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
