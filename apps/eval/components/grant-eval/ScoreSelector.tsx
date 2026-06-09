'use client'

const SCORES = [2, 4, 6, 8, 10] as const

interface Props {
  label: string
  value: number | null
  onChange: (v: number) => void
  disabled?: boolean
}

export function ScoreSelector({ label, value, onChange, disabled }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 shrink-0">{label}</span>
      <div className="flex gap-1">
        {SCORES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
            className={[
              'w-10 h-9 rounded text-sm font-medium border transition-colors',
              value === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
              disabled ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          >
            {s}
          </button>
        ))}
      </div>
      {value !== null && (
        <span className="text-sm font-semibold text-blue-700">{value}점</span>
      )}
    </div>
  )
}
