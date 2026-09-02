import type { NextRequest } from 'next/server'

import { okrFilterSchema } from '@/lib/validation/schemas'
import { filtersFromSearchParams, withApiContext } from '@/server/api'
import { createObjective, listObjectives } from '@/server/services/objectives'

export async function GET(request: NextRequest) {
  return withApiContext(async (context) => {
    const filter = okrFilterSchema.parse(filtersFromSearchParams(request.nextUrl.searchParams))
    return listObjectives(context, filter)
  })
}

export async function POST(request: NextRequest) {
  return withApiContext(async (context) => createObjective(context, await request.json()))
}
