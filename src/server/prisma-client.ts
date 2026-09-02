import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

/**
 * Builds a Prisma client for whichever kind of PostgreSQL `DATABASE_URL` names.
 *
 * Against a plain server the default TCP client is used. Against a serverless
 * provider (Neon) queries go through the Neon driver adapter instead:
 * serverless functions are short-lived and numerous, and a pool of raw TCP
 * connections per instance exhausts the database's connection limit. The
 * adapter multiplexes over the provider's own pooler.
 *
 * Shared by the app and by `prisma/seed.ts`, so both connect the same way.
 */
export function isServerlessPostgres(url: string | undefined): boolean {
  return Boolean(url && /\.neon\.tech(?::|\/|$)/.test(url))
}

export function createPrismaClient(): PrismaClient {
  const log: ('warn' | 'error')[] =
    process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']

  const url = process.env.DATABASE_URL
  if (!isServerlessPostgres(url)) {
    return new PrismaClient({ log })
  }

  // The Neon driver speaks Postgres over a WebSocket, which every serverless
  // runtime provides; Node needs a WebSocket implementation supplied.
  neonConfig.webSocketConstructor = ws

  return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }), log })
}
