import type { Metadata } from 'next'
import { CalendarCheck, CheckCircle2, ClipboardCheck } from 'lucide-react'

import { CheckInTimeline } from '@/components/okr/check-in-timeline'
import { FilterBar } from '@/components/shared/filter-bar'
import { Num } from '@/components/shared/num'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/states'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, weekBoundsFor } from '@/lib/date'
import { requireSessionContext } from '@/server/context'
import { listCheckIns, listPendingCheckIns } from '@/server/services/check-ins'
import { getDefaultQuarter, listOwnerOptions, listQuarters } from '@/server/services/workspace'

import { PendingCheckInRow } from './pending-check-in'

export const metadata: Metadata = { title: 'بازبینی‌ها' }

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ quarterId?: string; ownerId?: string }>
}) {
  const context = await requireSessionContext()
  const params = await searchParams

  const [defaultQuarter, quarters, owners] = await Promise.all([
    getDefaultQuarter(context),
    listQuarters(context),
    listOwnerOptions(context),
  ])
  const quarterId = params.quarterId ?? defaultQuarter?.id

  const [pending, recent] = await Promise.all([
    listPendingCheckIns(context),
    listCheckIns(context, { quarterId, authorId: params.ownerId, take: 40 }),
  ])

  const week = weekBoundsFor(new Date())
  const thisWeek = recent.filter((checkIn) => checkIn.createdAt >= week.start)
  const withBlockers = recent.filter((checkIn) => Boolean(checkIn.blockers))

  return (
    <div className="space-y-6">
      <PageHeader
        title="بازبینی‌ها"
        description={`هفته جاری: ${formatDate(week.start, context.organization.calendarType, 'short')} تا ${formatDate(week.end, context.organization.calendarType, 'short')}`}
        actions={
          <FilterBar
            showSearch={false}
            filters={[
              {
                key: 'quarterId',
                label: 'کوارتر',
                allLabel: 'همه کوارترها',
                options: quarters.map((quarter) => ({ value: quarter.id, label: quarter.label })),
              },
              {
                key: 'ownerId',
                label: 'ثبت‌کننده',
                allLabel: 'همه افراد',
                options: owners.map((owner) => ({ value: owner.id, label: owner.name })),
              },
            ]}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="در انتظار بازبینی شما"
          value={pending.length}
          icon={ClipboardCheck}
          tone={pending.length > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="بازبینی‌های این هفته"
          value={thisWeek.length}
          icon={CalendarCheck}
          tone="info"
        />
        <StatCard
          label="بازبینی‌های دارای بلاکر"
          value={withBlockers.length}
          icon={CheckCircle2}
          tone={withBlockers.length > 0 ? 'danger' : 'success'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-4" />
            نتایج کلیدی در انتظار بازبینی
            <Num value={pending.length} className="text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pending.length === 0 ? (
            <EmptyState
              className="m-5 border-0"
              icon={CheckCircle2}
              title="همه بازبینی‌های این هفته انجام شده"
              description="نتیجه کلیدی معوقی ندارید. هفته آینده دوباره سر بزنید."
            />
          ) : (
            pending.map((keyResult) => (
              <PendingCheckInRow
                key={keyResult.id}
                keyResult={keyResult}
                objectiveTitle={keyResult.objective.title}
                lastCheckInAt={keyResult.lastCheckInAt}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>جریان بازبینی‌های سازمان</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <EmptyState
              className="border-0"
              icon={CalendarCheck}
              title="بازبینی‌ای ثبت نشده است"
              description="اولین بازبینی هفتگی را روی یکی از نتایج کلیدی ثبت کنید."
            />
          ) : (
            <CheckInTimeline
              checkIns={recent.map((checkIn) => ({ ...checkIn }))}
              unit={undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
