import type { ActivityAction, EntityType, NotificationType, Prisma } from '@prisma/client'

/** Append to the organization's activity feed. */
export async function logActivity(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string
    actorId: string
    action: ActivityAction
    entityType: EntityType
    entityId: string
    summary: string
    metadata?: Prisma.InputJsonValue
  },
): Promise<void> {
  await tx.activityLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      metadata: input.metadata ?? {},
    },
  })
}

/** Queue an in-app notification. Never notifies someone about their own action. */
export async function notify(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string
    userId: string
    actorId?: string
    type: NotificationType
    title: string
    body?: string
    link?: string
    entityType?: EntityType
    entityId?: string
  },
): Promise<void> {
  if (input.actorId && input.actorId === input.userId) return

  await tx.notification.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      entityType: input.entityType,
      entityId: input.entityId,
    },
  })
}
