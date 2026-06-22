'use client'

import { useEffect } from 'react'

export function SwUnregister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister())
      })
    }
  }, [])
  return null
}
