import type { NextRequest } from 'next/server'

import { withApiContext } from '@/server/api'
import { createCheckIn, listCheckIns } from '@/server/services/check-ins'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  return withApiContext(async (context) =>
    listCheckIns(context, {
      keyResultId: params.get('keyResultId') ?? undefined,
      authorId: params.get('authorId') ?? undefined,
      quarterId: params.get('quarterId') ?? undefined,
    }),
  )
}

export async function POST(request: NextRequest) {
  return withApiContext(async (context) => createCheckIn(context, await request.json()))
}
