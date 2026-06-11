import { describe, it, expect } from 'vitest'
import { isActiveDelegation } from '../../apps/approval/lib/delegation-utils'

const TODAY = '2026-06-11'

describe('isActiveDelegation', () => {
  it('returns true for always-active delegation (no dates)', () => {
    expect(isActiveDelegation({ is_active: true, start_date: null, end_date: null }, TODAY)).toBe(true)
  })

  it('returns false when is_active is false', () => {
    expect(isActiveDelegation({ is_active: false, start_date: null, end_date: null }, TODAY)).toBe(false)
  })

  it('returns false when start_date is in the future', () => {
    expect(isActiveDelegation({ is_active: true, start_date: '2026-06-12', end_date: null }, TODAY)).toBe(false)
  })

  it('returns true when start_date is today', () => {
    expect(isActiveDelegation({ is_active: true, start_date: '2026-06-11', end_date: null }, TODAY)).toBe(true)
  })

  it('returns true when start_date is in the past', () => {
    expect(isActiveDelegation({ is_active: true, start_date: '2026-06-01', end_date: null }, TODAY)).toBe(true)
  })

  it('returns false when end_date has passed', () => {
    expect(isActiveDelegation({ is_active: true, start_date: null, end_date: '2026-06-10' }, TODAY)).toBe(false)
  })

  it('returns true when end_date is today', () => {
    expect(isActiveDelegation({ is_active: true, start_date: null, end_date: '2026-06-11' }, TODAY)).toBe(true)
  })

  it('returns true when within date range', () => {
    expect(isActiveDelegation({ is_active: true, start_date: '2026-06-01', end_date: '2026-06-30' }, TODAY)).toBe(true)
  })

  it('returns false when before date range', () => {
    expect(isActiveDelegation({ is_active: true, start_date: '2026-06-15', end_date: '2026-06-30' }, TODAY)).toBe(false)
  })

  it('returns false when after date range', () => {
    expect(isActiveDelegation({ is_active: true, start_date: '2026-06-01', end_date: '2026-06-05' }, TODAY)).toBe(false)
  })

  it('returns false when is_active is false even if within date range', () => {
    expect(isActiveDelegation({ is_active: false, start_date: '2026-06-01', end_date: '2026-06-30' }, TODAY)).toBe(false)
  })
})
