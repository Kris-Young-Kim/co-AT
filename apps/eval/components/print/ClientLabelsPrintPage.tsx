'use client'

import { useState } from 'react'
import { PrintButton } from '@/eval/components/print/PrintButton'
import { ClientLabelView } from '@/eval/components/print/ClientLabelView'
import { Printer, CheckSquare, Square } from 'lucide-react'

interface LabelClient {
  id: string
  name: string
  birth_date: string | null
  registration_number: string | null
  qr_token: string
}

interface Props {
  clients: LabelClient[]
}

export function ClientLabelsPrintPage({ clients }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPrinting, setIsPrinting] = useState(false)

  const toggleAll = () => {
    if (selected.size === clients.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(clients.map(c => c.id)))
    }
  }

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedClients = clients.filter(c => selected.has(c.id))

  if (isPrinting) {
    return (
      <>
        <div className="fixed top-4 right-4 no-print z-10">
          <div className="flex gap-2">
            <button
              onClick={() => setIsPrinting(false)}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            >
              목록으로
            </button>
            <PrintButton />
          </div>
        </div>
        <ClientLabelView clients={selectedClients} />
      </>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">대상자 QR 라벨 일괄 인쇄</h1>
        <button
          onClick={() => setIsPrinting(true)}
          disabled={selected.size === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="h-4 w-4" />
          선택한 {selected.size}명 인쇄
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-3">
          <button onClick={toggleAll} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            {selected.size === clients.length && clients.length > 0
              ? <CheckSquare className="h-4 w-4 text-blue-600" />
              : <Square className="h-4 w-4" />
            }
            전체 선택 ({clients.length}명)
          </button>
        </div>
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {clients.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-400 text-center">등록된 대상자가 없습니다.</p>
          ) : (
            clients.map(client => (
              <label
                key={client.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(client.id)}
                  onChange={() => toggle(client.id)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-500">
                    {client.birth_date ?? '생년월일 미등록'}
                    {client.registration_number ? ` · ${client.registration_number}` : ''}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        A4 용지 기준 한 페이지에 최대 15개 라벨이 인쇄됩니다
      </p>
    </div>
  )
}
