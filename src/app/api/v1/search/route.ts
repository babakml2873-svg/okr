import type { NextRequest } from 'next/server'

import { searchSchema } from '@/lib/validation/schemas'
import { withApiContext } from '@/server/api'
import { globalSearch } from '@/server/services/search'

export async function GET(request: NextRequest) {
  return withApiContext(async (context) => {
    const params = request.nextUrl.searchParams
    const parsed = searchSchema.safeParse({
      q: params.get('q') ?? '',
      limit: params.get('limit') ?? undefined,
    })
    if (!parsed.success) return []
    return globalSearch(context, parsed.data.q, parsed.data.limit)
  })
}
