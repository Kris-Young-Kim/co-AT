'use client'

import React from 'react'

export type DomainData = Record<string, unknown>
export interface DomainFieldProps {
  data: DomainData
  set: (key: string, value: unknown) => void
}

export const FUTURE_PLAN_OPTIONS = [
  '시험적용', '정보제공', '대여', '교육 및 훈련', '개조', '제작',
  '재원확보', '점검', '세척', '수리', '재사용', '기타',
]

export function str(v: unknown): string { return v != null ? String(v) : '' }
export function arr(v: unknown): string[] { return Array.isArray(v) ? (v as string[]) : [] }
export function bool(v: unknown): boolean { return v === true }

export function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">{title}</h4>
      {children}
    </div>
  )
}

export function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <div className="flex flex-wrap gap-2 items-center">{children}</div>
    </div>
  )
}

export function Radio({
  label, value, options, onChange, inline = true,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; inline?: boolean
}) {
  return (
    <FieldRow label={label}>
      <div className={inline ? 'flex flex-wrap gap-3' : 'grid grid-cols-2 gap-2'}>
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-1 cursor-pointer text-sm text-gray-700">
            <input
              type="radio" className="accent-blue-600"
              checked={value === opt} onChange={() => onChange(opt)}
            />
            {opt}
          </label>
        ))}
      </div>
    </FieldRow>
  )
}

export function MultiCheck({
  label, options, values, onChange,
}: {
  label?: string; options: string[]; values: string[]; onChange: (v: string[]) => void
}) {
  function toggle(opt: string) {
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt])
  }
  return (
    <FieldRow label={label ?? ''}>
      <div className="flex flex-wrap gap-3">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-1 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox" className="accent-blue-600"
              checked={values.includes(opt)} onChange={() => toggle(opt)}
            />
            {opt}
          </label>
        ))}
      </div>
    </FieldRow>
  )
}

export function TextRow({
  label, value, onChange, placeholder, wide,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean
}) {
  return (
    <FieldRow label={label}>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${wide ? 'w-full' : 'w-48'}`}
      />
    </FieldRow>
  )
}

export function NumRow({
  label, value, onChange, unit,
}: {
  label: string; value: string; onChange: (v: string) => void; unit?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-28 shrink-0">{label}</span>
      <input
        type="text" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)}
        className="border rounded px-2 py-1 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {unit && <span className="text-xs text-gray-500">{unit}</span>}
    </div>
  )
}
