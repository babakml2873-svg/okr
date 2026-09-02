import type { Metadata } from 'next'

import { requireSessionContext } from '@/server/context'
import { listQuarters, refreshQuarterStatuses } from '@/server/services/workspace'

import { AdminOnly } from '../admin-guard'
import { QuartersManager } from './quarters-manager'

export const metadata: Metadata = { title: 'کوارترها' }

export default async function QuartersSettingsPage() {
  const context = await requireSessionContext()
  if (context.membership.role !== 'ADMIN') return <AdminOnly />

  // Bring statuses in line with the clock before rendering them.
  await refreshQuarterStatuses(context)
  const quarters = await listQuarters(context)

  return (
    <QuartersManager
      calendarType={context.organization.calendarType}
      quarters={quarters.map((quarter) => ({
        id: quarter.id,
        year: quarter.year,
        quarterNumber: quarter.quarterNumber,
        label: quarter.label,
        startDate: quarter.startDate,
        endDate: quarter.endDate,
        status: quarter.status,
        objectiveCount: quarter._count.objectives,
      }))}
    />
  )
}
