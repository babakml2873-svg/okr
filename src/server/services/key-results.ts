import type { KeyResult, Prisma } from '@prisma/client'

import { calculateKeyResultProgress } from '@/lib/okr'
import type { OkrFilterInput } from '@/lib/validation/schemas'
import { keyResultSchema, updateKeyResultSchema } from '@/lib/validation/schemas'
import {
  NotFoundError,
  requirePermission,
  ValidationError,
  type SessionContext,
} from '@/server/context'
import { prisma } from '@/server/db'

import { logActivity, notify } from './activity'
import { syncAfterKeyResultChange } from './recalculate'

const keyResultListSelect = {
  id: true,
  title: true,
  description: true,
  metricType: true,
  startValue: true,
  currentValue: true,
  targetValue: true,
  unit: true,
  weight: true,
  progress: true,
  confidence: true,
  status: true,
  health: true,
  dueDate: true,
  ownerId: true,
  objectiveId: true,
  lastCheckInAt: true,
  autoUpdateFromInitiatives: true,
  owner: { select: { id: true, name: true, avatarUrl: true } },
  objective: {
    select: {
      id: true,
      title: true,
      level: true,
      departmentId: true,
      teamId: true,
      ownerId: true,
      quarterId: true,
      department: { select: { id: true, name: true, color: true } },
      quarter: { select: { id: true, label: true, startDate: true, endDate: true } },
    },
  },
  _count: { select: { initiatives: true, checkIns: true } },
} satisfies Prisma.KeyResultSelect

export type KeyResultListItem = Prisma.KeyResultGetPayload<{ select: typeof keyResultListSelect }>

export async function listKeyResults(
  context: SessionContext,
  filter: OkrFilterInput & { objectiveId?: string } = {},
): Promise<KeyResultListItem[]> {
  requirePermission(context, 'objective:view')

  return prisma.keyResult.findMany({
    where: {
      organizationId: context.organization.id,
      ...(filter.objectiveId ? { objectiveId: filter.objectiveId } : {}),
      ...(filter.ownerId ? { ownerId: filter.ownerId } : {}),
      ...(filter.health ? { health: filter.health } : {}),
      ...(filter.search ? { title: { contains: filter.search, mode: 'insensitive' } } : {}),
      objective: {
        archivedAt: null,
        ...(filter.quarterId ? { quarterId: filter.quarterId } : {}),
        ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
        ...(filter.teamId ? { teamId: filter.teamId } : {}),
        ...(filter.level ? { level: filter.level } : {}),
      },
    },
    select: keyResultListSelect,
    orderBy: [{ objectiveId: 'asc' }, { sortOrder: 'asc' }],
  })
}

const keyResultDetailInclude = {
  owner: { select: { id: true, name: true, avatarUrl: true, email: true, jobTitle: true } },
  objective: {
    select: {
      id: true,
      title: true,
      level: true,
      ownerId: true,
      departmentId: true,
      teamId: true,
      department: { select: { id: true, name: true, color: true } },
      quarter: true,
    },
  },
  initiatives: {
    orderBy: { sortOrder: 'asc' },
    include: { owner: { select: { id: true, name: true, avatarUrl: true } } },
  },
  checkIns: {
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  },
} satisfies Prisma.KeyResultInclude

export type KeyResultDetail = Prisma.KeyResultGetPayload<{ include: typeof keyResultDetailInclude }>

export async function getKeyResult(
  context: SessionContext,
  keyResultId: string,
): Promise<KeyResultDetail> {
  requirePermission(context, 'objective:view')

  const keyResult = await prisma.keyResult.findFirst({
    where: { id: keyResultId, organizationId: context.organization.id },
    include: keyResultDetailInclude,
  })
  if (!keyResult) throw new NotFoundError('نتیجه کلیدی موردنظر یافت نشد.')
  return keyResult
}

/** Load the parent objective and check it belongs to the caller's org. */
async function loadParentObjective(context: SessionContext, objectiveId: string) {
  const objective = await prisma.objective.findFirst({
    where: { id: objectiveId, organizationId: context.organization.id },
    select: { id: true, title: true, ownerId: true, departmentId: true, teamId: true, level: true },
  })
  if (!objective)
    throw new ValidationError('هدف انتخاب‌شده معتبر نیست.', { objectiveId: ['نامعتبر'] })
  return objective
}

async function assertOwnerInOrg(context: SessionContext, ownerId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId: ownerId, organizationId: context.organization.id, status: 'ACTIVE' },
    select: { id: true },
  })
  if (!membership)
    throw new ValidationError('مالک انتخاب‌شده عضو این سازمان نیست.', { ownerId: ['نامعتبر'] })
}

export async function createKeyResult(context: SessionContext, input: unknown): Promise<KeyResult> {
  const data = keyResultSchema.parse(input)
  const objective = await loadParentObjective(context, data.objectiveId)

  requirePermission(context, 'keyResult:create', {
    organizationId: context.organization.id,
    ownerId: data.ownerId,
    parentOwnerId: objective.ownerId,
    departmentId: objective.departmentId,
    teamId: objective.teamId,
    level: objective.level,
  })
  await assertOwnerInOrg(context, data.ownerId)

  const sortOrder = await prisma.keyResult.count({ where: { objectiveId: objective.id } })

  return prisma.$transaction(async (tx) => {
    const keyResult = await tx.keyResult.create({
      data: {
        organizationId: context.organization.id,
        objectiveId: objective.id,
        title: data.title,
        description: data.description || null,
        metricType: data.metricType,
        startValue: data.startValue,
        currentValue: data.currentValue,
        targetValue: data.targetValue,
        unit: data.unit || null,
        weight: data.weight,
        confidence: data.confidence,
        ownerId: data.ownerId,
        dueDate: data.dueDate,
        autoUpdateFromInitiatives: data.autoUpdateFromInitiatives,
        sortOrder,
        progress: calculateKeyResultProgress(data),
      },
    })

    await logActivity(tx, {
      organizationId: context.organization.id,
      actorId: context.user.id,
      action: 'CREATED',
      entityType: 'KEY_RESULT',
      entityId: keyResult.id,
      summary: `نتیجه کلیدی «${keyResult.title}» را ایجاد کرد`,
    })

    await notify(tx, {
      organizationId: context.organization.id,
      userId: data.ownerId,
      actorId: context.user.id,
      type: 'KEY_RESULT_ASSIGNED',
      title: 'نتیجه کلیدی جدیدی به شما واگذار شد',
      body: keyResult.title,
      link: `/key-results/${keyResult.id}`,
      entityType: 'KEY_RESULT',
      entityId: keyResult.id,
    })

    await syncAfterKeyResultChange(tx, context.organization.id, keyResult.id)
    return keyResult
  })
}

export async function updateKeyResult(context: SessionContext, input: unknown): Promise<KeyResult> {
  const data = updateKeyResultSchema.parse(input)

  const existing = await prisma.keyResult.findFirst({
    where: { id: data.id, organizationId: context.organization.id },
    include: {
      objective: { select: { ownerId: true, departmentId: true, teamId: true, level: true } },
    },
  })
  if (!existing) throw new NotFoundError('نتیجه کلیدی موردنظر یافت نشد.')

  requirePermission(context, 'keyResult:update', {
    organizationId: existing.organizationId,
    ownerId: existing.ownerId,
    parentOwnerId: existing.objective.ownerId,
    departmentId: existing.objective.departmentId,
    teamId: existing.objective.teamId,
    level: existing.objective.level,
  })
  if (data.ownerId) await assertOwnerInOrg(context, data.ownerId)

  // Re-validate the metric shape against the merged values, not just the patch.
  const merged = {
    metricType: data.metricType ?? existing.metricType,
    startValue: data.startValue ?? existing.startValue,
    targetValue: data.targetValue ?? existing.targetValue,
  }
  if (merged.metricType === 'INCREASE' && merged.targetValue < merged.startValue) {
    throw new ValidationError('برای متریک افزایشی، مقدار هدف باید بزرگ‌تر از مقدار شروع باشد.', {
      targetValue: ['مقدار هدف نامعتبر است'],
    })
  }
  if (merged.metricType === 'DECREASE' && merged.targetValue > merged.startValue) {
    throw new ValidationError('برای متریک کاهشی، مقدار هدف باید کوچک‌تر از مقدار شروع باشد.', {
      targetValue: ['مقدار هدف نامعتبر است'],
    })
  }

  return prisma.$transaction(async (tx) => {
    const keyResult = await tx.keyResult.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.metricType !== undefined ? { metricType: data.metricType } : {}),
        ...(data.startValue !== undefined ? { startValue: data.startValue } : {}),
        ...(data.currentValue !== undefined ? { currentValue: data.currentValue } : {}),
        ...(data.targetValue !== undefined ? { targetValue: data.targetValue } : {}),
        ...(data.unit !== undefined ? { unit: data.unit || null } : {}),
        ...(data.weight !== undefined ? { weight: data.weight } : {}),
        ...(data.confidence !== undefined ? { confidence: data.confidence } : {}),
        ...(data.ownerId !== undefined ? { ownerId: data.ownerId } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.autoUpdateFromInitiatives !== undefined
          ? { autoUpdateFromInitiatives: data.autoUpdateFromInitiatives }
          : {}),
      },
    })

    await logActivity(tx, {
      organizationId: context.organization.id,
      actorId: context.user.id,
      action: 'UPDATED',
      entityType: 'KEY_RESULT',
      entityId: keyResult.id,
      summary: `نتیجه کلیدی «${keyResult.title}» را به‌روزرسانی کرد`,
    })

    if (data.ownerId && data.ownerId !== existing.ownerId) {
      await notify(tx, {
        organizationId: context.organization.id,
        userId: data.ownerId,
        actorId: context.user.id,
        type: 'KEY_RESULT_ASSIGNED',
        title: 'نتیجه کلیدی به شما واگذار شد',
        body: keyResult.title,
        link: `/key-results/${keyResult.id}`,
        entityType: 'KEY_RESULT',
        entityId: keyResult.id,
      })
    }

    await syncAfterKeyResultChange(tx, context.organization.id, keyResult.id)
    return keyResult
  })
}

export async function deleteKeyResult(context: SessionContext, keyResultId: string): Promise<void> {
  const existing = await prisma.keyResult.findFirst({
    where: { id: keyResultId, organizationId: context.organization.id },
    include: {
      objective: { select: { ownerId: true, departmentId: true, teamId: true, level: true } },
    },
  })
  if (!existing) throw new NotFoundError('نتیجه کلیدی موردنظر یافت نشد.')

  requirePermission(context, 'keyResult:delete', {
    organizationId: existing.organizationId,
    ownerId: existing.ownerId,
    parentOwnerId: existing.objective.ownerId,
    departmentId: existing.objective.departmentId,
    teamId: existing.objective.teamId,
    level: existing.objective.level,
  })

  await prisma.$transaction(async (tx) => {
    await tx.keyResult.delete({ where: { id: existing.id } })
    await logActivity(tx, {
      organizationId: context.organization.id,
      actorId: context.user.id,
      action: 'DELETED',
      entityType: 'KEY_RESULT',
      entityId: existing.id,
      summary: `نتیجه کلیدی «${existing.title}» را حذف کرد`,
    })
    await syncAfterKeyResultChange(tx, context.organization.id)
  })
}
