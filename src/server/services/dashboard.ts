import { formatJalaliDayMonth } from '@/lib/date'
import { requirePermission, type SessionContext } from '@/server/context'
import { prisma } from '@/server/db'

/**
 * Read-only analytics for the executive dashboard.
 *
 * Everything here reads the cached `progress`/`health` columns rather than
 * recomputing, which is exactly why those columns are kept in sync on write.
 */

export interface DashboardSummary {
  totalObjectives: number
  activeObjectives: number
  completedObjectives: number
  atRiskObjectives: number
  averageProgress: number
  totalKeyResults: number
  completedKeyResults: number
  averageConfidence: number
  pendingCheckIns: number
}

export async function getDashboardSummary(
  context: SessionContext,
  quarterId?: string,
): Promise<DashboardSummary> {
  requirePermission(context, 'objective:view')

  const where = {
    organizationId: context.organization.id,
    archivedAt: null,
    ...(quarterId ? { quarterId } : {}),
  }

  const [objectives, keyResults, pendingCheckIns] = await Promise.all([
    prisma.objective.findMany({
      where,
      select: { status: true, health: true, progress: true, confidence: true },
    }),
    prisma.keyResult.findMany({
      where: {
        organizationId: context.organization.id,
        objective: { archivedAt: null, ...(quarterId ? { quarterId } : {}) },
      },
      select: { status: true, progress: true },
    }),
    prisma.keyResult.count({
      where: {
        organizationId: context.organization.id,
        status: 'ACTIVE',
        lastCheckInAt: null,
        objective: { archivedAt: null, ...(quarterId ? { quarterId } : {}) },
      },
    }),
  ])

  const total = objectives.length
  const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0)

  return {
    totalObjectives: total,
    activeObjectives: objectives.filter((o) => o.status === 'ACTIVE').length,
    completedObjectives: objectives.filter((o) => o.status === 'COMPLETED').length,
    atRiskObjectives: objectives.filter(
      (o) => o.status === 'ACTIVE' && (o.health === 'AT_RISK' || o.health === 'OFF_TRACK'),
    ).length,
    averageProgress: total ? Math.round(sum(objectives.map((o) => o.progress)) / total) : 0,
    totalKeyResults: keyResults.length,
    completedKeyResults: keyResults.filter((kr) => kr.status === 'COMPLETED').length,
    averageConfidence: total
      ? Math.round((sum(objectives.map((o) => o.confidence)) / total) * 10) / 10
      : 0,
    pendingCheckIns,
  }
}

export interface DepartmentProgress {
  id: string
  name: string
  color: string
  progress: number
  objectiveCount: number
  atRisk: number
}

/** Average objective progress per department — the first dashboard chart. */
export async function getDepartmentProgress(
  context: SessionContext,
  quarterId?: string,
): Promise<DepartmentProgress[]> {
  requirePermission(context, 'objective:view')

  const departments = await prisma.department.findMany({
    where: { organizationId: context.organization.id },
    select: {
      id: true,
      name: true,
      color: true,
      objectives: {
        where: { archivedAt: null, ...(quarterId ? { quarterId } : {}) },
        select: { progress: true, health: true, status: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return departments.map((department) => {
    const objectives = department.objectives
    const progress = objectives.length
      ? Math.round(objectives.reduce((acc, o) => acc + o.progress, 0) / objectives.length)
      : 0
    return {
      id: department.id,
      name: department.name,
      color: department.color,
      progress,
      objectiveCount: objectives.length,
      atRisk: objectives.filter(
        (o) => o.status === 'ACTIVE' && (o.health === 'AT_RISK' || o.health === 'OFF_TRACK'),
      ).length,
    }
  })
}

export interface HealthDistribution {
  health: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK'
  count: number
}

export async function getHealthDistribution(
  context: SessionContext,
  quarterId?: string,
): Promise<HealthDistribution[]> {
  requirePermission(context, 'objective:view')

  const grouped = await prisma.objective.groupBy({
    by: ['health'],
    where: {
      organizationId: context.organization.id,
      archivedAt: null,
      status: { in: ['ACTIVE', 'COMPLETED'] },
      ...(quarterId ? { quarterId } : {}),
    },
    _count: { _all: true },
  })

  const counts = new Map(grouped.map((row) => [row.health, row._count._all]))
  return (['ON_TRACK', 'AT_RISK', 'OFF_TRACK'] as const).map((health) => ({
    health,
    count: counts.get(health) ?? 0,
  }))
}

export interface QuarterPerformance {
  quarterId: string
  label: string
  progress: number
  objectiveCount: number
  completed: number
}

/** Average progress per planning period — the quarter performance chart. */
export async function getQuarterPerformance(
  context: SessionContext,
): Promise<QuarterPerformance[]> {
  requirePermission(context, 'objective:view')

  const quarters = await prisma.quarter.findMany({
    where: { organizationId: context.organization.id, status: { in: ['ACTIVE', 'CLOSED'] } },
    select: {
      id: true,
      label: true,
      startDate: true,
      objectives: {
        where: { archivedAt: null },
        select: { progress: true, status: true },
      },
    },
    orderBy: { startDate: 'asc' },
    take: 8,
  })

  return quarters
    .filter((quarter) => quarter.objectives.length > 0)
    .map((quarter) => ({
      quarterId: quarter.id,
      label: quarter.label,
      progress: Math.round(
        quarter.objectives.reduce((acc, o) => acc + o.progress, 0) / quarter.objectives.length,
      ),
      objectiveCount: quarter.objectives.length,
      completed: quarter.objectives.filter((o) => o.status === 'COMPLETED').length,
    }))
}

export interface OwnerPerformance {
  id: string
  name: string
  avatarUrl: string | null
  jobTitle: string | null
  progress: number
  objectiveCount: number
  keyResultCount: number
  atRisk: number
}

/** Per-owner rollup — the owner performance chart and the individual report. */
export async function getOwnerPerformance(
  context: SessionContext,
  quarterId?: string,
  limit = 10,
): Promise<OwnerPerformance[]> {
  requirePermission(context, 'objective:view')

  const memberships = await prisma.membership.findMany({
    where: { organizationId: context.organization.id, status: 'ACTIVE' },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          jobTitle: true,
          ownedObjectives: {
            where: {
              organizationId: context.organization.id,
              archivedAt: null,
              ...(quarterId ? { quarterId } : {}),
            },
            select: { progress: true, health: true, status: true },
          },
          ownedKeyResults: {
            where: {
              organizationId: context.organization.id,
              objective: { archivedAt: null, ...(quarterId ? { quarterId } : {}) },
            },
            select: { progress: true },
          },
        },
      },
    },
  })

  return memberships
    .map(({ user }) => {
      // Owners with no objectives are still ranked, by their key results.
      const sources = user.ownedObjectives.length
        ? user.ownedObjectives.map((o) => o.progress)
        : user.ownedKeyResults.map((kr) => kr.progress)

      return {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        jobTitle: user.jobTitle,
        progress: sources.length
          ? Math.round(sources.reduce((acc, value) => acc + value, 0) / sources.length)
          : 0,
        objectiveCount: user.ownedObjectives.length,
        keyResultCount: user.ownedKeyResults.length,
        atRisk: user.ownedObjectives.filter(
          (o) => o.status === 'ACTIVE' && (o.health === 'AT_RISK' || o.health === 'OFF_TRACK'),
        ).length,
      }
    })
    .filter((row) => row.objectiveCount > 0 || row.keyResultCount > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit)
}

export interface ProgressTrendPoint {
  date: string
  label: string
  progress: number
}

/** Daily average progress across the organization — the trend sparkline. */
export async function getProgressTrend(
  context: SessionContext,
  quarterId?: string,
  days = 60,
): Promise<ProgressTrendPoint[]> {
  requirePermission(context, 'objective:view')

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const objectiveIds = await prisma.objective.findMany({
    where: {
      organizationId: context.organization.id,
      archivedAt: null,
      ...(quarterId ? { quarterId } : {}),
    },
    select: { id: true },
  })
  if (objectiveIds.length === 0) return []

  const snapshots = await prisma.progressSnapshot.findMany({
    where: {
      organizationId: context.organization.id,
      subjectType: 'OBJECTIVE',
      subjectId: { in: objectiveIds.map((row) => row.id) },
      capturedOn: { gte: since },
    },
    select: { capturedOn: true, progress: true },
    orderBy: { capturedOn: 'asc' },
  })

  const byDay = new Map<string, number[]>()
  for (const snapshot of snapshots) {
    const key = snapshot.capturedOn.toISOString().slice(0, 10)
    const bucket = byDay.get(key) ?? []
    bucket.push(snapshot.progress)
    byDay.set(key, bucket)
  }

  return [...byDay.entries()].map(([date, values]) => ({
    date,
    label: formatJalaliDayMonth(new Date(date)),
    progress: Math.round(values.reduce((acc, value) => acc + value, 0) / values.length),
  }))
}

/** The organization's recent activity feed. */
export async function getRecentActivity(context: SessionContext, take = 12) {
  requirePermission(context, 'objective:view')

  return prisma.activityLog.findMany({
    where: { organizationId: context.organization.id },
    include: { actor: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take,
  })
}

/** Objectives that need attention now — the dashboard's risk list. */
export async function getAtRiskObjectives(context: SessionContext, quarterId?: string, take = 6) {
  requirePermission(context, 'objective:view')

  return prisma.objective.findMany({
    where: {
      organizationId: context.organization.id,
      archivedAt: null,
      status: 'ACTIVE',
      health: { in: ['AT_RISK', 'OFF_TRACK'] },
      ...(quarterId ? { quarterId } : {}),
    },
    select: {
      id: true,
      title: true,
      progress: true,
      health: true,
      level: true,
      owner: { select: { id: true, name: true, avatarUrl: true } },
      department: { select: { name: true, color: true } },
    },
    orderBy: [{ health: 'desc' }, { progress: 'asc' }],
    take,
  })
}
