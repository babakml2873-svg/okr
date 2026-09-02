import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { PermissionError } from '@/lib/auth/permissions'
import {
  getSessionContext,
  NotFoundError,
  ValidationError,
  type SessionContext,
} from '@/server/context'

/**
 * Shared plumbing for the REST surface under /api/v1.
 *
 * The REST layer exists next to the server actions so the same services can be
 * driven by integrations and end-to-end tests. Both go through the identical
 * permission checks — this wrapper just maps domain errors onto status codes.
 */
export type RouteHandler<T> = (context: SessionContext) => Promise<T>

export async function withApiContext<T>(handler: RouteHandler<T>): Promise<NextResponse> {
  const context = await getSessionContext()
  if (!context) {
    return NextResponse.json({ error: 'برای دسترسی به این بخش باید وارد شوید.' }, { status: 401 })
  }

  try {
    return NextResponse.json({ data: await handler(context) })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'اطلاعات واردشده معتبر نیست.', fieldErrors: error.flatten().fieldErrors },
        { status: 422 },
      )
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, fieldErrors: error.fieldErrors },
        { status: 422 },
      )
    }
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error('[api] unexpected error', error)
    return NextResponse.json({ error: 'خطای غیرمنتظره‌ای رخ داد.' }, { status: 500 })
  }
}

/** Read OKR filters off the query string. */
export function filtersFromSearchParams(searchParams: URLSearchParams) {
  const value = (key: string) => searchParams.get(key) ?? undefined
  return {
    quarterId: value('quarterId'),
    departmentId: value('departmentId'),
    teamId: value('teamId'),
    ownerId: value('ownerId'),
    level: value('level') as never,
    status: value('status') as never,
    health: value('health') as never,
    search: value('search'),
  }
}
