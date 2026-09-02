import { requirePermission, type SessionContext } from '@/server/context'
import { prisma } from '@/server/db'

export async function listNotifications(context: SessionContext, take = 20) {
  requirePermission(context, 'objective:view')

  return prisma.notification.findMany({
    where: { organizationId: context.organization.id, userId: context.user.id },
    orderBy: { createdAt: 'desc' },
    take,
  })
}

export async function countUnreadNotifications(context: SessionContext): Promise<number> {
  return prisma.notification.count({
    where: { organizationId: context.organization.id, userId: context.user.id, readAt: null },
  })
}

/** Mark one notification read, or all of them when no id is given. */
export async function markNotificationsRead(
  context: SessionContext,
  notificationId?: string,
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      organizationId: context.organization.id,
      userId: context.user.id,
      readAt: null,
      ...(notificationId ? { id: notificationId } : {}),
    },
    data: { readAt: new Date() },
  })
}
