import type { CheckIn, Prisma } from '@prisma/client'

import { calculateHealth, calculateKeyResultProgress } from '@/lib/okr'
import { weekBoundsFor } from '@/lib/date'
import { checkInSchema } from '@/lib/validation/schemas'
import { NotFoundError, requirePermission, type SessionContext } from '@/server/context'
import { prisma } from '@/server/db'

import { logActivity, notify } from './activity'
import { captureSnapshots, syncAfterKeyResultChange } from './recalculate'

const checkInInclude = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  keyResult: {
    select: {
      id: true,
      title: true,
      unit: true,
      metricType: true,
      targetValue: true,
      objective: { select: { id: true, title: true, departmentId: true } },
    },
  },
} satisfies Prisma.CheckInInclude

export type CheckInWithContext = Prisma.CheckInGetPayload<{ include: typeof checkInInclude }>

export async function listCheckIns(
  context: SessionContext,
  filter: { keyResultId?: string; authorId?: string; quarterId?: string; take?: number } = {},
): Promise<CheckInWithContext[]> {
  requirePermission(context, 'objective:view')

  return prisma.checkIn.findMany({
    where: {
      organizationId: context.organization.id,
      ...(filter.keyResultId ? { keyResultId: filter.keyResultId } : {}),
      ...(filter.authorId ? { authorId: filter.authorId } : {}),
      ...(filter.quarterId ? { keyResult: { objective: { quarterId: filter.quarterId } } } : {}),
    },
    include: checkInInclude,
    orderBy: { createdAt: 'desc' },
    take: filter.take ?? 50,
  })
}

/**
 * Record a check-in against a key result.
 *
 * This is the product's central write: it moves the metric, recomputes the key
 * result and every objective above it, stores a dated snapshot for the trend
 * charts, and notifies the objective owner when the result turns risky — all
 * in one transaction so the numbers never disagree.
 */
export async function createCheckIn(context: SessionContext, input: unknown): Promise<CheckIn> {
  const data = checkInSchema.parse(input)
  const now = new Date()

  const keyResult = await prisma.keyResult.findFirst({
    where: { id: data.keyResultId, organizationId: context.organization.id },
    include: {
      objective: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          departmentId: true,
          teamId: true,
          level: true,
          quarter: { select: { startDate: true, endDate: true } },
        },
      },
    },
  })
  if (!keyResult) throw new NotFoundError('نتیجه کلیدی موردنظر یافت نشد.')

  requirePermission(context, 'keyResult:checkIn', {
    organizationId: keyResult.organizationId,
    ownerId: keyResult.ownerId,
    parentOwnerId: keyResult.objective.ownerId,
    departmentId: keyResult.objective.departmentId,
    teamId: keyResult.objective.teamId,
    level: keyResult.objective.level,
  })

  const newProgress = calculateKeyResultProgress({
    metricType: keyResult.metricType,
    startValue: keyResult.startValue,
    currentValue: data.newValue,
    targetValue: keyResult.targetValue,
  })

  const health = calculateHealth({
    progress: newProgress,
    confidence: data.confidence,
    periodStart: keyResult.objective.quarter.startDate,
    periodEnd: keyResult.objective.quarter.endDate,
    now,
  })

  const { start: periodStart, end: periodEnd } = weekBoundsFor(now)

  return prisma.$transaction(async (tx) => {
    const checkIn = await tx.checkIn.create({
      data: {
        organizationId: context.organization.id,
        keyResultId: keyResult.id,
        authorId: context.user.id,
        cadence: data.cadence,
        previousValue: keyResult.currentValue,
        newValue: data.newValue,
        previousProgress: keyResult.progress,
        newProgress,
        confidence: data.confidence,
        health,
        note: data.note || null,
        blockers: data.blockers || null,
        nextActions: data.nextActions || null,
        periodStart,
        periodEnd,
      },
    })

    await tx.keyResult.update({
      where: { id: keyResult.id },
      data: { currentValue: data.newValue, confidence: data.confidence, lastCheckInAt: now },
    })

    await syncAfterKeyResultChange(tx, context.organization.id, keyResult.id, now)
    await captureSnapshots(tx, context.organization.id, now)

    await logActivity(tx, {
      organizationId: context.organization.id,
      actorId: context.user.id,
      action: 'CHECKED_IN',
      entityType: 'KEY_RESULT',
      entityId: keyResult.id,
      summary: `برای «${keyResult.title}» بازبینی ثبت کرد`,
      metadata: { previousProgress: keyResult.progress, newProgress },
    })

    // Tell the objective owner when their key result starts slipping.
    if (health !== 'ON_TRACK') {
      await notify(tx, {
        organizationId: context.organization.id,
        userId: keyResult.objective.ownerId,
        actorId: context.user.id,
        type: 'AT_RISK',
        title: 'یک نتیجه کلیدی در معرض ریسک است',
        body: `${keyResult.title} — ${keyResult.objective.title}`,
        link: `/key-results/${keyResult.id}`,
        entityType: 'KEY_RESULT',
        entityId: keyResult.id,
      })
    }

    return checkIn
  })
}

/**
 * Key results the caller owns that have not been checked in this week — the
 * work list on the reviews page.
 */
export async function listPendingCheckIns(context: SessionContext, now = new Date()) {
  const { start } = weekBoundsFor(now)

  return prisma.keyResult.findMany({
    where: {
      organizationId: context.organization.id,
      ownerId: context.user.id,
      status: 'ACTIVE',
      objective: { archivedAt: null, status: 'ACTIVE', quarter: { status: 'ACTIVE' } },
      OR: [{ lastCheckInAt: null }, { lastCheckInAt: { lt: start } }],
    },
    select: {
      id: true,
      title: true,
      progress: true,
      health: true,
      currentValue: true,
      targetValue: true,
      startValue: true,
      metricType: true,
      unit: true,
      confidence: true,
      lastCheckInAt: true,
      objective: { select: { id: true, title: true } },
    },
    orderBy: [{ lastCheckInAt: 'asc' }, { progress: 'asc' }],
  })
}
