import type { Prisma } from '@prisma/client'

import {
  calculateHealth,
  calculateKeyResultProgress,
  rollupObjectiveTree,
  type RollupNode,
} from '@/lib/okr'

/**
 * Keeps the cached `progress` and `health` columns in step with the domain
 * engine.
 *
 * Progress is stored rather than computed on read because every list, chart
 * and report sorts and filters on it. The trade-off is that every write must
 * recalculate — which is what this module does, always inside the caller's
 * transaction so a partial update can never be observed.
 */

/** Recompute one key result's progress and health from its own numbers. */
export async function recalculateKeyResult(
  tx: Prisma.TransactionClient,
  keyResultId: string,
  now = new Date(),
): Promise<void> {
  const keyResult = await tx.keyResult.findUnique({
    where: { id: keyResultId },
    select: {
      id: true,
      metricType: true,
      startValue: true,
      currentValue: true,
      targetValue: true,
      confidence: true,
      status: true,
      autoUpdateFromInitiatives: true,
      objective: { select: { quarter: { select: { startDate: true, endDate: true } } } },
    },
  })
  if (!keyResult) return

  let currentValue = keyResult.currentValue

  // A milestone key result can track the initiatives beneath it instead of
  // being updated by hand.
  if (keyResult.metricType === 'MILESTONE' && keyResult.autoUpdateFromInitiatives) {
    currentValue = await tx.initiative.count({
      where: { keyResultId: keyResult.id, status: 'DONE' },
    })
  }

  const progress = calculateKeyResultProgress({
    metricType: keyResult.metricType,
    startValue: keyResult.startValue,
    currentValue,
    targetValue: keyResult.targetValue,
  })

  const health = calculateHealth({
    progress,
    confidence: keyResult.confidence,
    periodStart: keyResult.objective.quarter.startDate,
    periodEnd: keyResult.objective.quarter.endDate,
    now,
  })

  await tx.keyResult.update({
    where: { id: keyResult.id },
    data: {
      currentValue,
      progress,
      health,
      // Reaching the target completes the key result; slipping back reopens it.
      status:
        progress >= 100 ? 'COMPLETED' : keyResult.status === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE',
      completedAt: progress >= 100 ? (now as Date) : null,
    },
  })
}

/**
 * Recompute an objective and every ancestor above it.
 *
 * The whole alignment tree for the organization is loaded once — organizations
 * have tens of objectives per quarter, not thousands — and resolved in memory
 * so a deep chain costs one query rather than one per level.
 */
export async function recalculateObjectiveTree(
  tx: Prisma.TransactionClient,
  organizationId: string,
  now = new Date(),
): Promise<void> {
  const objectives = await tx.objective.findMany({
    where: { organizationId, archivedAt: null },
    select: {
      id: true,
      parentId: true,
      rollupMode: true,
      progress: true,
      health: true,
      status: true,
      confidence: true,
      quarter: { select: { startDate: true, endDate: true } },
      keyResults: {
        where: { status: { not: 'CANCELLED' } },
        select: { progress: true, weight: true },
      },
    },
  })

  const childrenOf = new Map<string, string[]>()
  for (const objective of objectives) {
    if (!objective.parentId) continue
    const siblings = childrenOf.get(objective.parentId) ?? []
    siblings.push(objective.id)
    childrenOf.set(objective.parentId, siblings)
  }

  const nodes: RollupNode[] = objectives.map((objective) => ({
    id: objective.id,
    rollupMode: objective.rollupMode,
    keyResults: objective.keyResults.map((kr) => ({ progress: kr.progress, weight: kr.weight })),
    childIds: childrenOf.get(objective.id) ?? [],
  }))

  const progressById = rollupObjectiveTree(nodes)

  // Only write rows whose numbers actually moved.
  const updates: Prisma.PrismaPromise<unknown>[] = []

  for (const objective of objectives) {
    const progress = progressById.get(objective.id) ?? 0
    const health = calculateHealth({
      progress,
      confidence: objective.confidence,
      periodStart: objective.quarter.startDate,
      periodEnd: objective.quarter.endDate,
      now,
    })

    const shouldComplete = progress >= 100 && objective.status === 'ACTIVE'
    const shouldReopen = progress < 100 && objective.status === 'COMPLETED'

    if (
      progress === objective.progress &&
      health === objective.health &&
      !shouldComplete &&
      !shouldReopen
    ) {
      continue
    }

    updates.push(
      tx.objective.update({
        where: { id: objective.id },
        data: {
          progress,
          health,
          ...(shouldComplete ? { status: 'COMPLETED' as const, completedAt: now } : {}),
          ...(shouldReopen ? { status: 'ACTIVE' as const, completedAt: null } : {}),
        },
      }),
    )
  }

  await Promise.all(updates)
}

/** One snapshot per subject per day; a same-day re-check-in overwrites it. */
export async function captureSnapshots(
  tx: Prisma.TransactionClient,
  organizationId: string,
  now = new Date(),
): Promise<void> {
  const capturedOn = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const [objectives, keyResults] = await Promise.all([
    tx.objective.findMany({
      where: { organizationId, archivedAt: null },
      select: { id: true, progress: true, confidence: true, health: true },
    }),
    tx.keyResult.findMany({
      where: { organizationId, status: { not: 'CANCELLED' } },
      select: { id: true, progress: true, confidence: true, health: true },
    }),
  ])

  const rows = [
    ...objectives.map((row) => ({ ...row, subjectType: 'OBJECTIVE' as const })),
    ...keyResults.map((row) => ({ ...row, subjectType: 'KEY_RESULT' as const })),
  ]

  await Promise.all(
    rows.map((row) =>
      tx.progressSnapshot.upsert({
        where: {
          subjectType_subjectId_capturedOn: {
            subjectType: row.subjectType,
            subjectId: row.id,
            capturedOn,
          },
        },
        create: {
          organizationId,
          subjectType: row.subjectType,
          subjectId: row.id,
          progress: row.progress,
          confidence: row.confidence,
          health: row.health,
          capturedOn,
        },
        update: { progress: row.progress, confidence: row.confidence, health: row.health },
      }),
    ),
  )
}

/**
 * The standard post-write routine: refresh the key result (when one changed),
 * roll the change up the alignment tree, and record today's snapshot.
 */
export async function syncAfterKeyResultChange(
  tx: Prisma.TransactionClient,
  organizationId: string,
  keyResultId?: string,
  now = new Date(),
): Promise<void> {
  if (keyResultId) await recalculateKeyResult(tx, keyResultId, now)
  await recalculateObjectiveTree(tx, organizationId, now)
}
