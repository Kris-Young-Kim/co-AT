---
name: new-app
description: Scaffold a new internal app in the GWATC monorepo with standard boilerplate — Next.js config, Clerk middleware, Supabase client, shared packages wiring, and Tailwind setup.
disable-model-invocation: false
---

# New App Scaffolder

Scaffold a new `apps/<name>` entry in the GWATC monorepo.

## Usage
```
/new-app <app-name>
```
Example: `/new-app eval`

## What to Create

### 1. `apps/<name>/package.json`
```json
{
  "name": "@co-at/<name>",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port <PORT>",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@co-at/ui": "workspace:*",
    "@co-at/lib": "workspace:*",
    "@co-at/auth": "workspace:*",
    "@co-at/types": "workspace:*",
    "next": "^16.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

Port assignment (avoid conflicts):
- eval: 3002, inventory: 3003, stats: 3004, automation: 3005, hr: 3006, approval: 3007

### 2. `apps/<name>/next.config.mjs`
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@co-at/ui', '@co-at/lib', '@co-at/auth', '@co-at/types'],
}
export default nextConfig
```

### 3. `apps/<name>/middleware.ts`
```ts
export { authMiddleware as middleware } from '@co-at/auth'
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 4. `apps/<name>/app/layout.tsx`
```tsx
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import '../globals.css'

export const metadata: Metadata = {
  title: 'GWATC — <AppName>',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}
```

### 5. `apps/<name>/app/page.tsx`
```tsx
export default function Page() {
  return (
    <main>
      <h1><AppName> 대시보드</h1>
    </main>
  )
}
```

### 6. `apps/<name>/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 7. `apps/<name>/tailwind.config.ts`
```ts
import type { Config } from 'tailwindcss'
import baseConfig from '@co-at/ui/tailwind.config'

export default {
  ...baseConfig,
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
} satisfies Config
```

### 8. `apps/<name>/tsconfig.json`
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@co-at/types": ["../../packages/types/src/index.ts"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## After Scaffolding

1. Add app to `turbo.json` if needed (usually auto-detected)
2. Create Vercel project: `<name>.gwatc.cloud`
3. Copy environment variables from root `.env.example`
4. Run `pnpm install` from root to link workspace packages

## Checklist
- [ ] package.json with correct port
- [ ] next.config.mjs with transpilePackages
- [ ] middleware.ts using @co-at/auth
- [ ] app/layout.tsx with ClerkProvider
- [ ] app/page.tsx placeholder
- [ ] tailwind.config.ts extending base
- [ ] tsconfig.json with path aliases
