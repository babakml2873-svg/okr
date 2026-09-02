import type { NextRequest } from 'next/server'

import { withApiContext } from '@/server/api'
import { createInitiative, listInitiatives } from '@/server/services/initiatives'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  return withApiContext(async (context) =>
    listInitiatives(context, {
      keyResultId: params.get('keyResultId') ?? undefined,
      ownerId: params.get('ownerId') ?? undefined,
      quarterId: params.get('quarterId') ?? undefined,
    }),
  )
}

export async function POST(request: NextRequest) {
  return withApiContext(async (context) => createInitiative(context, await request.json()))
}
