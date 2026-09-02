import type { PrismaClient } from '@prisma/client'

import { createPrismaClient } from './prisma-client'

/**
 * A single Prisma client per process. Next.js hot-reloads modules in
 * development, so the instance is cached on `globalThis` to avoid opening a
 * new connection pool on every reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
