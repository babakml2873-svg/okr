import type { Initiative, Prisma } from '@prisma/client'

import { initiativeSchema, updateInitiativeSchema } from '@/lib/validation/schemas'
import {
  NotFoundError,
  requirePermission,
  ValidationError,
  type SessionContext,
} from '@/server/context'
import { prisma } from '@/server/db'

import { logActivity } from './activity'
import { syncAfterKeyResultChange } from './recalculate'

const initiativeInclude = {
  owner: { select: { id: true, name: true, avatarUrl: true } },
  keyResult: {
    select: {
      id: true,
      title: true,
      ownerId: true,
      autoUpdateFromInitiatives: true,
      objective: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          departmentId: true,
          teamId: true,
          level: true,
        },
      },
    },
  },
} satisfies Prisma.InitiativeInclude

export type InitiativeWithContext = Prisma.InitiativeGetPayload<{
  include: typeof initiativeInclude
}>

export async function listInitiatives(
  context: SessionContext,
  filter: {
    keyResultId?: string
    ownerId?: string
    status?: Initiative['status']
    quarterId?: string
  } = {},
): Promise<InitiativeWithContext[]> {
  requirePermission(context, 'objective:view')

  return prisma.initiative.findMany({
    where: {
      organizationId: context.organization.id,
      ...(filter.keyResultId ? { keyResultId: filter.keyResultId } : {}),
      ...(filter.ownerId ? { ownerId: filter.ownerId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.quarterId ? { keyResult: { objective: { quarterId: filter.quarterId } } } : {}),
    },
    include: initiativeInclude,
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { sortOrder: 'asc' }],
  })
}

async function loadKeyResultForInitiative(context: SessionContext, keyResultId: string) {
  const keyResult = await prisma.keyResult.findFirst({
    where: { id: keyResultId, organizationId: context.organization.id },
    select: {
      id: true,
      ownerId: true,
      autoUpdateFromInitiatives: true,
      objective: { select: { ownerId: true, departmentId: true, teamId: true, level: true } },
    },
  })
  if (!keyResult) {
    throw new ValidationError('نتیجه کلیدی انتخاب‌شده معتبر نیست.', { keyResultId: ['نامعتبر'] })
  }
  return keyResult
}

export async function createInitiative(
  context: SessionContext,
  input: unknown,
): Promise<Initiative> {
  const data = initiativeSchema.parse(input)
  const keyResult = await loadKeyResultForInitiative(context, data.keyResultId)

  requirePermission(context, 'initiative:create', {
    organizationId: context.organization.id,
    ownerId: keyResult.ownerId,
    parentOwnerId: keyResult.objective.ownerId,
    departmentId: keyResult.objective.departmentId,
    teamId: keyResult.objective.teamId,
    level: keyResult.objective.level,
  })

  const sortOrder = await prisma.initiative.count({ where: { keyResultId: keyResult.id } })

  return prisma.$transaction(async (tx) => {
    const initiative = await tx.initiative.create({
      data: {
        organizationId: context.organization.id,
        keyResultId: keyResult.id,
        title: data.title,
        description: data.description || null,
        ownerId: data.ownerId,
        status: data.status,
        dueDate: data.dueDate,
        completedAt: data.status === 'DONE' ? new Date() : null,
        sortOrder,
      },
    })

    await logActivity(tx, {
      organizationId: context.organization.id,
      actorId: context.user.id,
      action: 'CREATED',
      entityType: 'INITIATIVE',
      entityId: initiative.id,
      summary: `اقدام «${initiative.title}» را ایجاد کرد`,
    })

    // A milestone key result that tracks its initiatives needs a recount.
    if (keyResult.autoUpdateFromInitiatives) {
      await syncAfterKeyResultChange(tx, context.organization.id, keyResult.id)
    }

    return initiative
  })
}

export async function updateInitiative(
  context: SessionContext,
  input: unknown,
): Promise<Initiative> {
  const data = updateInitiativeSchema.parse(input)

  const existing = await prisma.initiative.findFirst({
    where: { id: data.id, organizationId: context.organization.id },
    include: initiativeInclude,
  })
  if (!existing) throw new NotFoundError('اقدام موردنظر یافت نشد.')

  requirePermission(context, 'initiative:update', {
    organizationId: existing.organizationId,
    ownerId: existing.ownerId,
    parentOwnerId: existing.keyResult.objective.ownerId,
    departmentId: existing.keyResult.objective.departmentId,
    teamId: existing.keyResult.objective.teamId,
    level: existing.keyResult.objective.level,
  })

  return prisma.$transaction(async (tx) => {
    const becameDone = data.status === 'DONE' && existing.status !== 'DONE'
    const leftDone =
      data.status !== undefined && data.status !== 'DONE' && existing.status === 'DONE'

    const initiative = await tx.initiative.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.ownerId !== undefined ? { ownerId: data.ownerId } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
        ...(becameDone ? { completedAt: new Date() } : {}),
        ...(leftDone ? { completedAt: null } : {}),
      },
    })

    await logActivity(tx, {
      organizationId: context.organization.id,
      actorId: context.user.id,
      action: data.status && data.status !== existing.status ? 'STATUS_CHANGED' : 'UPDATED',
      entityType: 'INITIATIVE',
      entityId: initiative.id,
      summary: `اقدام «${initiative.title}» را به‌روزرسانی کرد`,
    })

    if (existing.keyResult.autoUpdateFromInitiatives && (becameDone || leftDone)) {
      await syncAfterKeyResultChange(tx, context.organization.id, existing.keyResultId)
    }

    return initiative
  })
}

export async function deleteInitiative(
  context: SessionContext,
  initiativeId: string,
): Promise<void> {
  const existing = await prisma.initiative.findFirst({
    where: { id: initiativeId, organizationId: context.organization.id },
    include: initiativeInclude,
  })
  if (!existing) throw new NotFoundError('اقدام موردنظر یافت نشد.')

  requirePermission(context, 'initiative:delete', {
    organizationId: existing.organizationId,
    ownerId: existing.ownerId,
    parentOwnerId: existing.keyResult.objective.ownerId,
    departmentId: existing.keyResult.objective.departmentId,
    teamId: existing.keyResult.objective.teamId,
    level: existing.keyResult.objective.level,
  })

  await prisma.$transaction(async (tx) => {
    await tx.initiative.delete({ where: { id: existing.id } })
    await logActivity(tx, {
      organizationId: context.organization.id,
      actorId: context.user.id,
      action: 'DELETED',
      entityType: 'INITIATIVE',
      entityId: existing.id,
      summary: `اقدام «${existing.title}» را حذف کرد`,
    })
    if (existing.keyResult.autoUpdateFromInitiatives) {
      await syncAfterKeyResultChange(tx, context.organization.id, existing.keyResultId)
    }
  })
}
