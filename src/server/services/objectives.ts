import type { Objective, Prisma } from '@prisma/client'

import type { OkrFilterInput } from '@/lib/validation/schemas'
import { objectiveSchema, updateObjectiveSchema } from '@/lib/validation/schemas'
import {
  NotFoundError,
  requirePermission,
  ValidationError,
  type SessionContext,
} from '@/server/context'
import { prisma } from '@/server/db'

import { logActivity, notify } from './activity'
import { recalculateObjectiveTree } from './recalculate'

/** Fields every objective list needs; keeps list queries consistent. */
const objectiveListSelect = {
  id: true,
  title: true,
  description: true,
  level: true,
  status: true,
  health: true,
  progress: true,
  confidence: true,
  parentId: true,
  quarterId: true,
  departmentId: true,
  teamId: true,
  ownerId: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, name: true, avatarUrl: true, jobTitle: true } },
  department: { select: { id: true, name: true, color: true } },
  team: { select: { id: true, name: true } },
  quarter: {
    select: {
      id: true,
      label: true,
      year: true,
      quarterNumber: true,
      startDate: true,
      endDate: true,
    },
  },
  parent: { select: { id: true, title: true, level: true } },
  _count: { select: { keyResults: true, children: true } },
} satisfies Prisma.ObjectiveSelect

export type ObjectiveListItem = Prisma.ObjectiveGetPayload<{ select: typeof objectiveListSelect }>

/** Translate UI filters into a tenant-scoped Prisma `where` clause. */
export function buildObjectiveWhere(
  context: SessionContext,
  filter: OkrFilterInput = {},
): Prisma.ObjectiveWhereInput {
  return {
    organizationId: context.organization.id,
    archivedAt: null,
    ...(filter.quarterId ? { quarterId: filter.quarterId } : {}),
    ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
    ...(filter.teamId ? { teamId: filter.teamId } : {}),
    ...(filter.ownerId ? { ownerId: filter.ownerId } : {}),
    ...(filter.level ? { level: filter.level } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.health ? { health: filter.health } : {}),
    ...(filter.search
      ? {
          OR: [
            { title: { contains: filter.search, mode: 'insensitive' as const } },
            { description: { contains: filter.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }
}

export async function listObjectives(
  context: SessionContext,
  filter: OkrFilterInput = {},
): Promise<ObjectiveListItem[]> {
  requirePermission(context, 'objective:view')

  return prisma.objective.findMany({
    where: buildObjectiveWhere(context, filter),
    select: objectiveListSelect,
    orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  })
}

const objectiveDetailInclude = {
  owner: { select: { id: true, name: true, avatarUrl: true, jobTitle: true, email: true } },
  createdBy: { select: { id: true, name: true } },
  department: { select: { id: true, name: true, color: true } },
  team: { select: { id: true, name: true } },
  quarter: true,
  parent: { select: { id: true, title: true, level: true, progress: true, health: true } },
  children: {
    where: { archivedAt: null },
    select: {
      id: true,
      title: true,
      level: true,
      progress: true,
      health: true,
      status: true,
      owner: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { sortOrder: 'asc' },
  },
  keyResults: {
    orderBy: { sortOrder: 'asc' },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { initiatives: true, checkIns: true } },
    },
  },
} satisfies Prisma.ObjectiveInclude

export type ObjectiveDetail = Prisma.ObjectiveGetPayload<{ include: typeof objectiveDetailInclude }>

/** Load one objective, scoped to the caller's organization. */
export async function getObjective(
  context: SessionContext,
  objectiveId: string,
): Promise<ObjectiveDetail> {
  requirePermission(context, 'objective:view')

  const objective = await prisma.objective.findFirst({
    where: { id: objectiveId, organizationId: context.organization.id },
    include: objectiveDetailInclude,
  })
  if (!objective) throw new NotFoundError('هدف موردنظر یافت نشد.')
  return objective
}

/** Guard against an alignment parent that would create a cycle. */
async function assertNoAlignmentCycle(
  organizationId: string,
  objectiveId: string,
  parentId: string,
): Promise<void> {
  if (parentId === objectiveId) {
    throw new ValidationError('یک هدف نمی‌تواند والد خودش باشد.', { parentId: ['انتخاب نامعتبر'] })
  }

  const objectives = await prisma.objective.findMany({
    where: { organizationId },
    select: { id: true, parentId: true },
  })
  const parentOf = new Map(objectives.map((row) => [row.id, row.parentId]))

  let cursor: string | null | undefined = parentId
  const seen = new Set<string>([objectiveId])
  while (cursor) {
    if (seen.has(cursor)) {
      throw new ValidationError('این انتخاب باعث ایجاد حلقه در درخت هم‌راستایی می‌شود.', {
        parentId: ['ایجاد حلقه در هم‌راستایی'],
      })
    }
    seen.add(cursor)
    cursor = parentOf.get(cursor) ?? null
  }
}

/** Verify referenced rows belong to this organization before linking them. */
async function assertReferencesInOrg(
  organizationId: string,
  refs: {
    quarterId?: string | null
    ownerId?: string | null
    departmentId?: string | null
    teamId?: string | null
  },
): Promise<void> {
  if (refs.quarterId) {
    const quarter = await prisma.quarter.findFirst({
      where: { id: refs.quarterId, organizationId },
      select: { id: true },
    })
    if (!quarter)
      throw new ValidationError('کوارتر انتخاب‌شده معتبر نیست.', { quarterId: ['نامعتبر'] })
  }
  if (refs.ownerId) {
    const membership = await prisma.membership.findFirst({
      where: { userId: refs.ownerId, organizationId, status: 'ACTIVE' },
      select: { id: true },
    })
    if (!membership)
      throw new ValidationError('مالک انتخاب‌شده عضو این سازمان نیست.', { ownerId: ['نامعتبر'] })
  }
  if (refs.departmentId) {
    const department = await prisma.department.findFirst({
      where: { id: refs.departmentId, organizationId },
      select: { id: true },
    })
    if (!department)
      throw new ValidationError('دپارتمان انتخاب‌شده معتبر نیست.', { departmentId: ['نامعتبر'] })
  }
  if (refs.teamId) {
    const team = await prisma.team.findFirst({
      where: { id: refs.teamId, organizationId },
      select: { id: true },
    })
    if (!team) throw new ValidationError('تیم انتخاب‌شده معتبر نیست.', { teamId: ['نامعتبر'] })
  }
}

export async function createObjective(context: SessionContext, input: unknown): Promise<Objective> {
  const data = objectiveSchema.parse(input)

  requirePermission(context, 'objective:create', {
    organizationId: context.organization.id,
    ownerId: data.ownerId,
    departmentId: data.departmentId,
    teamId: data.teamId,
    level: data.level,
  })

  await assertReferencesInOrg(context.organization.id, data)
  if (data.parentId) {
    const parent = await prisma.objective.findFirst({
      where: { id: data.parentId, organizationId: context.organization.id },
      select: { id: true },
    })
    if (!parent) throw new ValidationError('هدف والد معتبر نیست.', { parentId: ['نامعتبر'] })
  }

  return prisma.$transaction(async (tx) => {
    const objective = await tx.objective.create({
      data: {
        organizationId: context.organization.id,
        title: data.title,
        description: data.description || null,
        level: data.level,
        status: data.status,
        ownerId: data.ownerId,
        createdById: context.user.id,
        departmentId: data.departmentId,
        teamId: data.teamId,
        quarterId: data.quarterId,
        parentId: data.parentId,
        confidence: data.confidence,
        rollupMode: data.rollupMode,
      },
    })

    await logActivity(tx, {
      organizationId: context.organization.id,
      actorId: context.user.id,
      action: 'CREATED',
      entityType: 'OBJECTIVE',
      entityId: objective.id,
      summary: `هدف «${objective.title}» را ایجاد کرد`,
    })

    await notify(tx, {
      organizationId: context.organization.id,
      userId: data.ownerId,
      actorId: context.user.id,
      type: 'OBJECTIVE_ASSIGNED',
      title: 'هدف جدیدی به شما واگذار شد',
      body: objective.title,
      link: `/objectives/${objective.id}`,
      entityType: 'OBJECTIVE',
      entityId: objective.id,
    })

    await recalculateObjectiveTree(tx, context.organization.id)
    return objective
  })
}

export async function updateObjective(context: SessionContext, input: unknown): Promise<Objective> {
  const data = updateObjectiveSchema.parse(input)

  const existing = await prisma.objective.findFirst({
    where: { id: data.id, organizationId: context.organization.id },
  })
  if (!existing) throw new NotFoundError('هدف موردنظر یافت نشد.')

  requirePermission(context, 'objective:update', {
    organizationId: existing.organizationId,
    ownerId: existing.ownerId,
    departmentId: existing.departmentId,
    teamId: existing.teamId,
    level: existing.level,
  })

  await assertReferencesInOrg(context.organization.id, data)
  if (data.parentId) {
    await assertNoAlignmentCycle(context.organization.id, existing.id, data.parentId)
  }

  return prisma.$transaction(async (tx) => {
    const objective = await tx.objective.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.level !== undefined ? { level: data.level } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.ownerId !== undefined ? { ownerId: data.ownerId } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.teamId !== undefined ? { teamId: data.teamId } : {}),
        ...(data.quarterId !== undefined ? { quarterId: data.quarterId } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
        ...(data.confidence !== undefined ? { confidence: data.confidence } : {}),
        ...(data.rollupMode !== undefined ? { rollupMode: data.rollupMode } : {}),
      },
    })

    await logActivity(tx, {
      organizationId: context.organization.id,
      actorId: context.user.id,
      action: data.status && data.status !== existing.status ? 'STATUS_CHANGED' : 'UPDATED',
      entityType: 'OBJECTIVE',
      entityId: objective.id,
      summary: `هدف «${objective.title}» را به‌روزرسانی کرد`,
    })

    if (data.ownerId && data.ownerId !== existing.ownerId) {
      await notify(tx, {
        organizationId: context.organization.id,
        userId: data.ownerId,
        actorId: context.user.id,
        type: 'OBJECTIVE_ASSIGNED',
        title: 'هدفی به شما واگذار شد',
        body: objective.title,
        link: `/objectives/${objective.id}`,
        entityType: 'OBJECTIVE',
        entityId: objective.id,
      })
    }

    await recalculateObjectiveTree(tx, context.organization.id)
    return objective
  })
}

/** Soft-delete: archived objectives leave history and check-ins intact. */
export async function archiveObjective(
  context: SessionContext,
  objectiveId: string,
): Promise<void> {
  const existing = await prisma.objective.findFirst({
    where: { id: objectiveId, organizationId: context.organization.id },
  })
  if (!existing) throw new NotFoundError('هدف موردنظر یافت نشد.')

  requirePermission(context, 'objective:delete', {
    organizationId: existing.organizationId,
    ownerId: existing.ownerId,
    departmentId: existing.departmentId,
    teamId: existing.teamId,
    level: existing.level,
  })

  await prisma.$transaction(async (tx) => {
    await tx.objective.update({
      where: { id: existing.id },
      data: { archivedAt: new Date(), status: 'CANCELLED' },
    })
    // Children lose their parent rather than disappearing with it.
    await tx.objective.updateMany({ where: { parentId: existing.id }, data: { parentId: null } })

    await logActivity(tx, {
      organizationId: context.organization.id,
      actorId: context.user.id,
      action: 'DELETED',
      entityType: 'OBJECTIVE',
      entityId: existing.id,
      summary: `هدف «${existing.title}» را حذف کرد`,
    })

    await recalculateObjectiveTree(tx, context.organization.id)
  })
}

/** The alignment tree for one quarter, ready to render as a hierarchy. */
export interface AlignmentNode {
  objective: ObjectiveListItem
  children: AlignmentNode[]
}

export async function getAlignmentTree(
  context: SessionContext,
  filter: OkrFilterInput = {},
): Promise<AlignmentNode[]> {
  const objectives = await listObjectives(context, filter)
  const byId = new Map(objectives.map((objective) => [objective.id, objective]))
  const nodes = new Map<string, AlignmentNode>(
    objectives.map((objective) => [objective.id, { objective, children: [] }]),
  )

  const roots: AlignmentNode[] = []
  for (const objective of objectives) {
    const node = nodes.get(objective.id)!
    // An objective whose parent is filtered out is rendered as a root.
    const parentNode = objective.parentId ? nodes.get(objective.parentId) : undefined
    if (parentNode && byId.has(objective.parentId!)) parentNode.children.push(node)
    else roots.push(node)
  }

  return roots
}
