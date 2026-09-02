import type { NextRequest } from 'next/server'

import { withApiContext } from '@/server/api'
import {
  getDashboardSummary,
  getDepartmentProgress,
  getHealthDistribution,
  getOwnerPerformance,
  getQuarterPerformance,
} from '@/server/services/dashboard'

export async function GET(request: NextRequest) {
  const quarterId = request.nextUrl.searchParams.get('quarterId') ?? undefined

  return withApiContext(async (context) => ({
    summary: await getDashboardSummary(context, quarterId),
    departments: await getDepartmentProgress(context, quarterId),
    health: await getHealthDistribution(context, quarterId),
    quarters: await getQuarterPerformance(context),
    owners: await getOwnerPerformance(context, quarterId),
  }))
}
