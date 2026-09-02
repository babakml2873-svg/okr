import type { Comment, Prisma } from '@prisma/client'

import { commentSchema } from '@/lib/validation/schemas'
import {
  NotFoundError,
  requirePermission,
  ValidationError,
  type SessionContext,
} from '@/server/context'
import { prisma } from '@/server/db'

import { logActivity, notify } from './activity'

const commentInclude = {
  author: { select: { id: true, name: true, avatarUrl: true, jobTitle: true } },
  replies: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  },
} satisfies Prisma.CommentInclude

export type CommentWithAuthor = Prisma.CommentGetPayload<{ include: typeof commentInclude }>

export type CommentTarget = {
  objectiveId?: string | null
  keyResultId?: string | null
  initiativeId?: string | null
  checkInId?: string | null
}

export async function listComments(
  context: SessionContext,
  target: CommentTarget,
): Promise<CommentWithAuthor[]> {
  requirePermission(context, 'objective:view')

  return prisma.comment.findMany({
    where: {
      organizationId: context.organization.id,
      deletedAt: null,
      parentId: null,
      ...(target.objectiveId ? { objectiveId: target.objectiveId } : {}),
      ...(target.keyResultId ? { keyResultId: target.keyResultId } : {}),
      ...(target.initiativeId ? { initiativeId: target.initiativeId } : {}),
      ...(target.checkInId ? { checkInId: target.checkInId } : {}),
    },
    include: commentInclude,
    orderBy: { createdAt: 'desc' },
  })
}

/** Confirm the thing being commented on exists inside this organization. */
async function resolveTargetOwner(
  context: SessionContext,
  target: CommentTarget,
): Promise<{ ownerId: string | null; link: string; title: string }> {
  const organizationId = context.organization.id

  if (target.objectiveId) {
    const objective = await prisma.objective.findFirst({
      where: { id: target.objectiveId, organizationId },
      select: { id: true, ownerId: true, title: true },
    })
    if (!objective) throw new ValidationError('هدف انتخاب‌شده معتبر نیست.')
    return {
      ownerId: objective.ownerId,
      link: `/objectives/${objective.id}`,
      title: objective.title,
    }
  }
  if (target.keyResultId) {
    const keyResult = await prisma.keyResult.findFirst({
      where: { id: target.keyResultId, organizationId },
      select: { id: true, ownerId: true, title: true },
    })
    if (!keyResult) throw new ValidationError('نتیجه کلیدی انتخاب‌شده معتبر نیست.')
    return {
      ownerId: keyResult.ownerId,
      link: `/key-results/${keyResult.id}`,
      title: keyResult.title,
    }
  }
  if (target.initiativeId) {
    const initiative = await prisma.initiative.findFirst({
      where: { id: target.initiativeId, organizationId },
      select: { id: true, ownerId: true, title: true, keyResultId: true },
    })
    if (!initiative) throw new ValidationError('اقدام انتخاب‌شده معتبر نیست.')
    return {
      ownerId: initiative.ownerId,
      link: `/key-results/${initiative.keyResultId}`,
      title: initiative.title,
    }
  }
  if (target.checkInId) {
    const checkIn = await prisma.checkIn.findFirst({
      where: { id: target.checkInId, organizationId },
      select: { id: true, authorId: true, keyResultId: true },
    })
    if (!checkIn) throw new ValidationError('بازبینی انتخاب‌شده معتبر نیست.')
    return {
      ownerId: checkIn.authorId,
      link: `/key-results/${checkIn.keyResultId}`,
      title: 'بازبینی',
    }
  }

  throw new ValidationError('دیدگاه باید به یک موضوع متصل باشد.')
}

export async function createComment(context: SessionContext, input: unknown): Promise<Comment> {
  const data = commentSchema.parse(input)
  requirePermission(context, 'comment:create', { organizationId: context.organization.id })

  const target = await resolveTargetOwner(context, data)

  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        organizationId: context.organization.id,
        authorId: context.user.id,
        body: data.body,
        objectiveId: data.objectiveId,
        keyResultId: data.keyResultId,
        initiativeId: data.initiativeId,
        checkInId: data.checkInId,
        parentId: data.parentId,
      },
    })

    await logActivity(tx, {
      organizationId: context.organization.id,
      actorId: context.user.id,
      action: 'COMMENTED',
      entityType: 'COMMENT',
      entityId: comment.id,
      summary: `روی «${target.title}» دیدگاه گذاشت`,
    })

    if (target.ownerId) {
      await notify(tx, {
        organizationId: context.organization.id,
        userId: target.ownerId,
        actorId: context.user.id,
        type: 'COMMENT_ADDED',
        title: 'دیدگاه جدیدی ثبت شد',
        body: `${context.user.name}: ${data.body.slice(0, 120)}`,
        link: target.link,
        entityType: 'COMMENT',
        entityId: comment.id,
      })
    }

    return comment
  })
}

export async function deleteComment(context: SessionContext, commentId: string): Promise<void> {
  const existing = await prisma.comment.findFirst({
    where: { id: commentId, organizationId: context.organization.id },
    select: { id: true, authorId: true },
  })
  if (!existing) throw new NotFoundError('دیدگاه موردنظر یافت نشد.')

  requirePermission(context, 'comment:delete', {
    organizationId: context.organization.id,
    ownerId: existing.authorId,
  })

  // Soft delete keeps the thread's shape when a parent comment goes.
  await prisma.comment.update({ where: { id: existing.id }, data: { deletedAt: new Date() } })
}
