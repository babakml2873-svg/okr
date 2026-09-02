import { cache } from 'react'
import { redirect } from 'next/navigation'

import type { Actor, Permission, ResourceContext, Role } from '@/lib/auth/permissions'
import { can, requirePermission as assertPermission } from '@/lib/auth/permissions'
import { auth } from '@/server/auth'
import { prisma } from '@/server/db'

/**
 * Everything a service needs to answer "who is asking, and on behalf of which
 * organization?". Resolved once per request (React `cache` dedupes it across
 * server components) and passed explicitly into every service call, so no
 * service can accidentally run without a tenant scope.
 */
export interface SessionContext {
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    jobTitle: string | null
  }
  organization: {
    id: string
    name: string
    slug: string
    calendarType: 'JALALI' | 'GREGORIAN'
  }
  membership: {
    id: string
    role: Role
    departmentId: string | null
    teamId: string | null
    departmentName: string | null
    teamName: string | null
  }
  actor: Actor
}

/**
 * Resolve the signed-in user's context, or null when signed out / without an
 * active membership. Memoised per request.
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const membership = await prisma.membership.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, jobTitle: true },
      },
      organization: {
        select: { id: true, name: true, slug: true, calendarType: true },
      },
      department: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
  })

  if (!membership) return null

  return {
    user: membership.user,
    organization: membership.organization,
    membership: {
      id: membership.id,
      role: membership.role,
      departmentId: membership.departmentId,
      teamId: membership.teamId,
      departmentName: membership.department?.name ?? null,
      teamName: membership.team?.name ?? null,
    },
    actor: {
      userId: membership.userId,
      organizationId: membership.organizationId,
      role: membership.role,
      departmentId: membership.departmentId,
      teamId: membership.teamId,
    },
  }
})

/**
 * Context or bust. Server components and actions behind the app shell use this;
 * signed-out visitors are redirected to the sign-in page.
 */
export async function requireSessionContext(): Promise<SessionContext> {
  const context = await getSessionContext()
  if (!context) redirect('/login')
  return context
}

/** Assert a permission for the current actor. */
export function requirePermission(
  context: SessionContext,
  permission: Permission,
  resource?: ResourceContext,
): void {
  assertPermission(context.actor, permission, resource)
}

/** Non-throwing permission check, for deciding what to render. */
export function hasPermission(
  context: SessionContext,
  permission: Permission,
  resource?: ResourceContext,
): boolean {
  return can(context.actor, permission, resource)
}

/** Thrown when a record exists but belongs to another organization, or not at all. */
export class NotFoundError extends Error {
  constructor(message = 'مورد درخواستی یافت نشد.') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/** Thrown for business-rule violations that are not permission problems. */
export class ValidationError extends Error {
  readonly fieldErrors: Record<string, string[]>

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
  }
}
