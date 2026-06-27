'use client'

import { CallLogForm } from './CallLogForm'
import { createCallLog } from '@/actions/call-log-actions'

interface CallLogNewWithSttProps {
  defaultDate: string
}

export function CallLogNewWithStt({ defaultDate: _defaultDate }: CallLogNewWithSttProps) {
  const handleSubmit = (input: Parameters<typeof createCallLog>[0]) =>
    createCallLog(input, null)

  return (
    <CallLogForm
      defaultValues={{}}
      onSubmit={handleSubmit}
      submitLabel="등록"
    />
  )
}
