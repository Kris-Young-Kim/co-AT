export const ROLES = {
  USER: 'user',
  STAFF: 'staff',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  staff: 1,
  manager: 2,
  admin: 3,
}

/** Returns true if userRole meets the required minimum role */
export function hasMinimumRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required]
}

/** App access keys stored in Clerk publicMetadata.apps[] */
export const APP_KEYS = {
  EVAL: 'eval',
  INVENTORY: 'inventory',
  STATS: 'stats',
  AUTOMATION: 'automation',
  HR: 'hr',
  APPROVAL: 'approval',
  FINANCE: 'finance',
} as const

export type AppKey = typeof APP_KEYS[keyof typeof APP_KEYS]
