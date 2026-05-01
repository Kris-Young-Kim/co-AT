/** Shared pagination params for all list queries */
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

/** Standard audit fields present on all tables */
export interface AuditFields {
  created_at: string
  updated_at: string
}

/** Clerk user metadata shape */
export interface ClerkPublicMetadata {
  role?: string
  apps?: string[]
}
