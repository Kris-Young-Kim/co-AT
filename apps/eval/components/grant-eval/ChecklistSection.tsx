'use client'

export interface ChecklistItem {
  question_id: string
  question_text: string
  hint_text: string | null
}

interface Props {
  items: ChecklistItem[]
  responses: Record<string, boolean>
  onChange: (id: string, value: boolean) => void
  disabled?: boolean
}

export function ChecklistSection({ items, responses, onChange, disabled }: Props) {
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <label key={item.question_id} className="flex gap-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 shrink-0"
            checked={responses[item.question_id] ?? false}
            disabled={disabled}
            onChange={(e) => onChange(item.question_id, e.target.checked)}
          />
          <div>
            <p className="text-sm text-gray-800">{item.question_text}</p>
            {item.hint_text && (
              <p className="text-xs text-gray-400 mt-0.5">{item.hint_text}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}
