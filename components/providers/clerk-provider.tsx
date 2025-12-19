"use client"

import { ClerkProvider as ClerkProviderBase } from "@clerk/nextjs"

interface ClerkProviderProps {
  children: React.ReactNode
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <ClerkProviderBase
      dynamic
      appearance={{
        elements: {
          rootBox: "w-full",
        },
      }}
    >
      {children}
    </ClerkProviderBase>
  )
}

