import type { NextRequest } from 'next/server'

import { withApiContext } from '@/server/api'
import { createComment, listComments } from '@/server/services/comments'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  return withApiContext(async (context) =>
    listComments(context, {
      objectiveId: params.get('objectiveId'),
      keyResultId: params.get('keyResultId'),
      initiativeId: params.get('initiativeId'),
      checkInId: params.get('checkInId'),
    }),
  )
}

export async function POST(request: NextRequest) {
  return withApiContext(async (context) => createComment(context, await request.json()))
}
