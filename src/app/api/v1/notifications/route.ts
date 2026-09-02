import type { NextRequest } from 'next/server'

import { withApiContext } from '@/server/api'
import {
  countUnreadNotifications,
  listNotifications,
  markNotificationsRead,
} from '@/server/services/notifications'

export async function GET() {
  return withApiContext(async (context) => ({
    items: await listNotifications(context),
    unread: await countUnreadNotifications(context),
  }))
}

export async function POST(request: NextRequest) {
  return withApiContext(async (context) => {
    const body = (await request.json().catch(() => ({}))) as { id?: string }
    await markNotificationsRead(context, body.id)
    return { read: true }
  })
}
