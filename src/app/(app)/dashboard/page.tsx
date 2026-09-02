import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ClipboardCheck, Target, TrendingUp } from 'lucide-react'
import { Suspense } from 'react'

import { DepartmentProgressChart } from '@/components/charts/department-progress-chart'
import { HealthDistributionChart } from '@/components/charts/health-distribution-chart'
import { OwnerPerformanceChart } from '@/components/charts/owner-performance-chart'
import { ProgressTrendChart } from '@/components/charts/progress-trend-chart'
import { QuarterPerformanceChart } from '@/components/charts/quarter-performance-chart'
import { HealthBadge } from '@/components/okr/health-badge'
import { ProgressBar } from '@/components/okr/progress-bar'
import { FilterBar } from '@/components/shared/filter-bar'
import { Num } from '@/components/shared/num'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState, StatGridSkeleton } from '@/components/shared/states'
import { UserChip } from '@/components/shared/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/date'
import { ACTIVITY_ACTION_LABELS, OBJECTIVE_LEVEL_LABELS } from '@/lib/okr'
import { requireSessionContext } from '@/server/context'
import {
  getAtRiskObjectives,
  getDashboardSummary,
  getDepartmentProgress,
  getHealthDistribution,
  getOwnerPerformance,
  getProgressTrend,
  getQuarterPerformance,
  getRecentActivity,
} from '@/server/services/dashboard'
import { getDefaultQuarter, listQuarters } from '@/server/services/workspace'

export const metadata: Metadata = { title: 'داشبورد' }

async function DashboardContent({ quarterId }: { quarterId?: string }) {
  const context = await requireSessionContext()

  const [summary, departments, health, quarterPerformance, owners, trend, activity, atRisk] =
    await Promise.all([
      getDashboardSummary(context, quarterId),
      getDepartmentProgress(context, quarterId),
      getHealthDistribution(context, quarterId),
      getQuarterPerformance(context),
      getOwnerPerformance(context, quarterId),
      getProgressTrend(context, quarterId),
      getRecentActivity(context),
      getAtRiskObjectives(context, quarterId),
    ])

  if (summary.totalObjectives === 0) {
    return (
      <EmptyState
        icon={Target}
        title="هنوز هدفی تعریف نشده است"
        description="اولین هدف سازمان را تعریف کنید تا داشبورد با داده‌های واقعی پر شود."
        action={{ label: 'ایجاد هدف جدید', href: '/objectives?new=1' }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="کل اهداف" value={summary.totalObjectives} icon={Target} />
        <StatCard
          label="OKRهای فعال"
          value={summary.activeObjectives}
          icon={TrendingUp}
          tone="info"
        />
        <StatCard
          label="میانگین پیشرفت"
          value={summary.averageProgress}
          variant="percent"
          icon={TrendingUp}
          tone={
            summary.averageProgress >= 70
              ? 'success'
              : summary.averageProgress >= 30
                ? 'warning'
                : 'danger'
          }
        />
        <StatCard
          label="اهداف در معرض ریسک"
          value={summary.atRiskObjectives}
          icon={AlertTriangle}
          tone="danger"
          hint={
            summary.pendingCheckIns > 0
              ? `${summary.pendingCheckIns} بازبینی انجام‌نشده`
              : undefined
          }
        />
        <StatCard
          label="اهداف تکمیل‌شده"
          value={summary.completedObjectives}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>پیشرفت به تفکیک دپارتمان</CardTitle>
          </CardHeader>
          <CardContent>
            <DepartmentProgressChart data={departments} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزیع سلامت اهداف</CardTitle>
          </CardHeader>
          <CardContent>
            <HealthDistributionChart data={health} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>عملکرد کوارترها</CardTitle>
          </CardHeader>
          <CardContent>
            <QuarterPerformanceChart data={quarterPerformance} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>عملکرد مالکان</CardTitle>
          </CardHeader>
          <CardContent>
            <OwnerPerformanceChart data={owners} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>روند پیشرفت سازمان</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressTrendChart data={trend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>اهداف نیازمند توجه</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/objectives?health=AT_RISK">مشاهده همه</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {atRisk.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                هیچ هدفی در معرض ریسک نیست
              </p>
            )}
            {atRisk.map((objective) => (
              <Link
                key={objective.id}
                href={`/objectives/${objective.id}`}
                className="hover:bg-accent block rounded-lg border p-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 text-sm font-medium">{objective.title}</span>
                  <HealthBadge health={objective.health} showIcon={false} />
                </div>
                <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                  <Badge variant="muted">{OBJECTIVE_LEVEL_LABELS[objective.level]}</Badge>
                  <span>{objective.owner.name}</span>
                  {objective.department && <span>· {objective.department.name}</span>}
                </div>
                <ProgressBar progress={objective.progress} size="sm" className="mt-2.5" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>فعالیت‌های اخیر</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reviews">
                <ClipboardCheck className="size-3.5" />
                بازبینی‌ها
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activity.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">فعالیتی ثبت نشده است</p>
            )}
            <ul className="space-y-3.5">
              {activity.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3">
                  <UserChip user={entry.actor} subtitle={null} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-relaxed">{entry.summary}</span>
                    <span className="text-muted-foreground text-xs">
                      {ACTIVITY_ACTION_LABELS[entry.action]} · {formatRelativeTime(entry.createdAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>خلاصه نتایج کلیدی</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs">کل نتایج کلیدی</p>
            <p className="mt-1 text-xl font-bold">
              <Num value={summary.totalKeyResults} />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">تکمیل‌شده</p>
            <p className="text-success mt-1 text-xl font-bold">
              <Num value={summary.completedKeyResults} />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">میانگین اطمینان</p>
            <p className="mt-1 text-xl font-bold">
              <Num value={summary.averageConfidence} fractionDigits={1} />
              <span className="text-muted-foreground text-sm"> از ۱۰</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ quarterId?: string }>
}) {
  const context = await requireSessionContext()
  const { quarterId } = await searchParams

  const [quarters, defaultQuarter] = await Promise.all([
    listQuarters(context),
    getDefaultQuarter(context),
  ])
  const selectedQuarter = quarterId ?? defaultQuarter?.id

  return (
    <div className="space-y-6">
      <PageHeader
        title={`داشبورد ${context.organization.name}`}
        description="نمای کلی عملکرد سازمان در کوارتر انتخاب‌شده"
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
            ]}
          />
        }
      />

      <Suspense fallback={<StatGridSkeleton />}>
        <DashboardContent quarterId={selectedQuarter} />
      </Suspense>
    </div>
  )
}
