"use server"

import { hasAdminOrStaffPermission } from './permissions'

type PermissionDenied = { success: false; error: string }

/**
 * Wraps a server action body with admin/staff permission check.
 * Returns { success: false, error: '권한이 없습니다' } if unauthorized.
 *
 * Usage:
 *   export async function myAction(input: Input) {
 *     return withStaffPermission(async () => {
 *       // ... logic
 *       return { success: true, ... }
 *     })
 *   }
 */
export async function withStaffPermission<T>(
  fn: () => Promise<T>
): Promise<T | PermissionDenied> {
  if (!(await hasAdminOrStaffPermission())) {
    return { success: false, error: '권한이 없습니다' }
  }
  return fn()
}
