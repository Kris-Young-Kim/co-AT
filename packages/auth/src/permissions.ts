'use server'

import { auth } from '@clerk/nextjs/server'
import type { UserRole, AppKey } from '@co-at/types'
import { ROLE_HIERARCHY, ROLES } from '@co-at/types'

function isValidRole(r: unknown): r is UserRole {
  return r === ROLES.USER || r === ROLES.STAFF || r === ROLES.MANAGER || r === ROLES.ADMIN
}

/** Get current user's role from Clerk session claims */
export async function getCurrentRole(): Promise<UserRole | null> {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  return isValidRole(role) ? role : null
}

/** Returns true if current user has at least the required role */
export async function requireRole(required: UserRole): Promise<boolean> {
  const role = await getCurrentRole()
  if (!role) return false
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required]
}

/** Returns true if current user has access to the given app */
export async function hasAppAccess(appKey: AppKey): Promise<boolean> {
  const { sessionClaims } = await auth()
  const meta = sessionClaims?.metadata as { role?: string; apps?: string[] } | undefined
  if (meta?.role === ROLES.ADMIN) return true
  return (meta?.apps ?? []).includes(appKey)
}

/** Throws error if user doesn't have required role */
export async function assertRole(required: UserRole): Promise<void> {
  const ok = await requireRole(required)
  if (!ok) {
    throw new Error(`Requires role: ${required}`)
  }
}

/** Returns true if current user has admin or staff role (or higher) */
export async function hasAdminOrStaffPermission(): Promise<boolean> {
  return requireRole(ROLES.STAFF)
}

/** Returns true if current user has manager role (or higher) */
export async function hasManagerPermission(): Promise<boolean> {
  return requireRole(ROLES.MANAGER)
}
