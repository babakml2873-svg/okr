import type { NextRequest } from 'next/server'

import { okrFilterSchema } from '@/lib/validation/schemas'
import { filtersFromSearchParams, withApiContext } from '@/server/api'
import { createKeyResult, listKeyResults } from '@/server/services/key-results'

export async function GET(request: NextRequest) {
  return withApiContext(async (context) => {
    const filter = okrFilterSchema.parse(filtersFromSearchParams(request.nextUrl.searchParams))
    const objectiveId = request.nextUrl.searchParams.get('objectiveId') ?? undefined
    return listKeyResults(context, { ...filter, objectiveId })
  })
}

export async function POST(request: NextRequest) {
  return withApiContext(async (context) => createKeyResult(context, await request.json()))
}
