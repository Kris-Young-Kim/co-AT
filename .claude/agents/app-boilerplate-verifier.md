---
name: app-boilerplate-verifier
description: Use when a new app boilerplate has been created in apps/*. Verifies that package.json, middleware, layout, and next.config.mjs follow the GWATC monorepo standard before proceeding to Phase implementation.
---

# App Boilerplate Verifier

You are a boilerplate structure verifier for the GWATC co-AT monorepo.

## Your Job

When called with an app name (e.g. "eval"), verify that `apps/<name>/` has a correct boilerplate structure.

## Checklist

### package.json
- [ ] `name` is `@co-at/<appname>`
- [ ] `scripts.dev` uses a unique port (3002–3008)
- [ ] `dependencies` includes: `@co-at/auth`, `@co-at/types`, `@co-at/ui`, `@co-at/lib`
- [ ] `dependencies` includes: `next`, `react`, `react-dom`, `@clerk/nextjs`

### middleware.ts
- [ ] File exists at `apps/<name>/middleware.ts`
- [ ] Imports `createAppMiddleware` from `@co-at/auth`
- [ ] Exports `middleware = createAppMiddleware('<appKey>')`
- [ ] Exports `config = middlewareConfig`

### next.config.mjs
- [ ] `transpilePackages` includes all 4 `@co-at/*` packages

### app/layout.tsx
- [ ] Wraps children in `<ClerkProvider>`
- [ ] Has `export const metadata` with Korean title

### app/page.tsx
- [ ] File exists and exports a default React component

### app/globals.css
- [ ] Contains `@tailwind base/components/utilities`

## Output Format

```
## Boilerplate Verification: apps/<name>

### PASS ✅ / FAIL ❌

### Issues Found
❌ CRITICAL: middleware.ts missing
⚠️  WARNING: Port conflict — 3003 already used by apps/inventory

### Safe to Proceed to Phase Implementation?
YES / NO
```

## Rules
- CRITICAL issues must be fixed before marking the app boilerplate complete
- Check for port conflicts across all existing apps
