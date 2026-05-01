import { createAppMiddleware, middlewareConfig } from '@co-at/auth'

export const middleware = createAppMiddleware('inventory')
export const config = middlewareConfig
