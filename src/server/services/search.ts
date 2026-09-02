import { requirePermission, type SessionContext } from '@/server/context'
import { prisma } from '@/server/db'

export interface SearchHit {
  id: string
  type: 'OBJECTIVE' | 'KEY_RESULT' | 'INITIATIVE' | 'USER'
  title: string
  subtitle: string | null
  href: string
  progress?: number
}

/**
 * Global search across objectives, key results, initiatives and people.
 *
 * Every branch is scoped to the caller's organization — including the user
 * search, which goes through memberships rather than the users table so it can
 * never surface an account from another workspace.
 */
export async function globalSearch(
  context: SessionContext,
  query: string,
  limit = 20,
): Promise<SearchHit[]> {
  requirePermission(context, 'objective:view')

  const term = query.trim()
  if (!term) return []

  const organizationId = context.organization.id
  const contains = { contains: term, mode: 'insensitive' as const }
  const perType = Math.max(3, Math.ceil(limit / 4))

  const [objectives, keyResults, initiatives, memberships] = await Promise.all([
    prisma.objective.findMany({
      where: {
        organizationId,
        archivedAt: null,
        OR: [{ title: contains }, { description: contains }],
      },
      select: {
        id: true,
        title: true,
        progress: true,
        quarter: { select: { label: true } },
        owner: { select: { name: true } },
      },
      take: perType,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.keyResult.findMany({
      where: { organizationId, OR: [{ title: contains }, { description: contains }] },
      select: {
        id: true,
        title: true,
        progress: true,
        objective: { select: { title: true } },
      },
      take: perType,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.initiative.findMany({
      where: { organizationId, OR: [{ title: contains }, { description: contains }] },
      select: { id: true, title: true, keyResultId: true, keyResult: { select: { title: true } } },
      take: perType,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.membership.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        user: { OR: [{ name: contains }, { email: contains }] },
      },
      select: { user: { select: { id: true, name: true, email: true, jobTitle: true } } },
      take: perType,
    }),
  ])

  return [
    ...objectives.map<SearchHit>((row) => ({
      id: row.id,
      type: 'OBJECTIVE',
      title: row.title,
      subtitle: `${row.quarter.label} · ${row.owner.name}`,
      href: `/objectives/${row.id}`,
      progress: row.progress,
    })),
    ...keyResults.map<SearchHit>((row) => ({
      id: row.id,
      type: 'KEY_RESULT',
      title: row.title,
      subtitle: row.objective.title,
      href: `/key-results/${row.id}`,
      progress: row.progress,
    })),
    ...initiatives.map<SearchHit>((row) => ({
      id: row.id,
      type: 'INITIATIVE',
      title: row.title,
      subtitle: row.keyResult.title,
      href: `/key-results/${row.keyResultId}`,
    })),
    ...memberships.map<SearchHit>(({ user }) => ({
      id: user.id,
      type: 'USER',
      title: user.name,
      subtitle: user.jobTitle ?? user.email,
      href: `/team-okrs?owner=${user.id}`,
    })),
  ].slice(0, limit)
}
