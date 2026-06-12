import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'components/**/*.test.ts', 'components/**/*.test.tsx', 'apps/web/components/**/*.test.ts', 'apps/web/components/**/*.test.tsx'],
    exclude: ['.worktrees/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@co-at/types': path.resolve(__dirname, './packages/types/src'),
      '@co-at/lib': path.resolve(__dirname, './packages/lib'),
      '@co-at/auth': path.resolve(__dirname, './packages/auth/src'),
      '@/apps/hr': path.resolve(__dirname, './apps/hr'),
      '@/lib/supabase-admin': path.resolve(__dirname, './apps/hr/lib/supabase-admin'),
      '@': path.resolve(__dirname, './'),
      'remotion': path.resolve(__dirname, './apps/web/node_modules/remotion'),
    },
  },
})
