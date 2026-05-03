import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CreateEmployeeInput } from '@co-at/types'

// Mock supabase-admin for hr app
const mockSingle = vi.fn(() => Promise.resolve({ data: { id: 'emp-1', name: 'Test' }, error: null }))

const mockChain = {
  insert: vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) })),
  select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [], error: null })) })) })),
  update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) })) })),
}

vi.mock('@/apps/hr/lib/supabase-admin', () => ({
  createSupabaseAdmin: vi.fn(() => ({ from: vi.fn(() => mockChain) })),
}))

vi.mock('@co-at/auth', () => ({
  assertRole: vi.fn(() => Promise.resolve()),
  getCurrentRole: vi.fn(() => Promise.resolve('admin')),
}))

describe('getEmployees', () => {
  it('returns employees array on success', async () => {
    const { getEmployees } = await import('@/apps/hr/actions/employee-actions')
    const result = await getEmployees()
    expect(Array.isArray(result)).toBe(true)
  })
})

describe('createEmployee', () => {
  it('returns created employee on success', async () => {
    const { createEmployee } = await import('@/apps/hr/actions/employee-actions')
    const input: CreateEmployeeInput = {
      name: '홍길동',
      email: 'hong@example.com',
      department: '보조공학팀',
      position: '보조공학사',
      employment_type: 'full_time',
      hire_date: '2024-01-01',
    }
    const result = await createEmployee(input)
    expect(result).toBeDefined()
  })
})
