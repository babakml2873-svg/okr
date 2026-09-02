import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, ListTodo } from 'lucide-react'

import { CheckInTimeline } from '@/components/okr/check-in-timeline'
import { CommentThread } from '@/components/okr/comment-thread'
import { ConfidenceMeter } from '@/components/okr/confidence-meter'
import { HealthBadge } from '@/components/okr/health-badge'
import { MetricValue } from '@/components/okr/metric-value'
import { ProgressBar } from '@/components/okr/progress-bar'
import { Num } from '@/components/shared/num'
import { PageHeader } from '@/components/shared/page-header'
import { UserChip } from '@/components/shared/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/date'
import { expectedProgressForQuarter } from '@/lib/date/objective-helpers'
import { KEY_RESULT_STATUS_LABELS, METRIC_TYPE_LABELS } from '@/lib/okr'
import { hasPermission, NotFoundError, requireSessionContext } from '@/server/context'
import { listComments } from '@/server/services/comments'
import { getKeyResult } from '@/server/services/key-results'
import { listOwnerOptions } from '@/server/services/workspace'

import { KeyResultActions } from '../../objectives/[id]/key-result-actions'
import { InitiativeList } from './initiative-list'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const context = await requireSessionContext()
    const keyResult = await getKeyResult(context, (await params).id)
    return { title: keyResult.title }
  } catch {
    return { title: 'نتیجه کلیدی' }
  }
}

export default async function KeyResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireSessionContext()
  const { id } = await params

  let keyResult
  try {
    keyResult = await getKeyResult(context, id)
  } catch (error) {
    if (error instanceof NotFoundError) notFound()
    throw error
  }

  const [comments, owners] = await Promise.all([
    listComments(context, { keyResultId: keyResult.id }),
    listOwnerOptions(context),
  ])

  const resource = {
    organizationId: keyResult.organizationId,
    ownerId: keyResult.ownerId,
    parentOwnerId: keyResult.objective.ownerId,
    departmentId: keyResult.objective.departmentId,
    teamId: keyResult.objective.teamId,
    level: keyResult.objective.level,
  }
  const canUpdate = hasPermission(context, 'keyResult:update', resource)
  const canCheckIn = hasPermission(context, 'keyResult:checkIn', resource)
  const canManageInitiatives = hasPermission(context, 'initiative:create', resource)
  const ownerOptions = owners.map((owner) => ({ id: owner.id, name: owner.name }))
  const expected = expectedProgressForQuarter(keyResult.objective.quarter)

  return (
    <div className="space-y-6">
      <nav
        className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm"
        aria-label="مسیر"
      >
        <Link href="/key-results" className="hover:text-foreground">
          نتایج کلیدی
        </Link>
        <ChevronRight className="size-3.5 rotate-180" />
        <Link
          href={`/objectives/${keyResult.objective.id}`}
          className="hover:text-foreground truncate"
        >
          {keyResult.objective.title}
        </Link>
        <ChevronRight className="size-3.5 rotate-180" />
        <span className="text-foreground truncate">{keyResult.title}</span>
      </nav>

      <PageHeader
        title={keyResult.title}
        description={keyResult.description}
        actions={
          <KeyResultActions
            keyResult={{ ...keyResult, objectiveId: keyResult.objectiveId }}
            owners={ownerOptions}
            canUpdate={canUpdate}
            canDelete={hasPermission(context, 'keyResult:delete', resource)}
            canCheckIn={canCheckIn}
            compact={false}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge>{METRIC_TYPE_LABELS[keyResult.metricType]}</Badge>
        <Badge variant="secondary">{KEY_RESULT_STATUS_LABELS[keyResult.status]}</Badge>
        <HealthBadge health={keyResult.health} />
        {keyResult.objective.department && (
          <Badge variant="outline">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: keyResult.objective.department.color }}
            />
            {keyResult.objective.department.name}
          </Badge>
        )}
        <Badge variant="muted">{keyResult.objective.quarter.label}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <MetricValue
                  metricType={keyResult.metricType}
                  startValue={keyResult.startValue}
                  currentValue={keyResult.currentValue}
                  targetValue={keyResult.targetValue}
                  unit={keyResult.unit}
                />
                <span className="text-2xl font-bold">
                  <Num value={keyResult.progress} variant="percent" />
                </span>
              </div>
              <ProgressBar
                progress={keyResult.progress}
                expected={expected}
                size="lg"
                showValue={false}
              />
              <p className="text-muted-foreground mt-2 text-xs">
                پیشرفت مورد انتظار در این مقطع: <Num value={expected} variant="percent" />
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="size-4" />
                اقدامات
                <Num value={keyResult.initiatives.length} className="text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InitiativeList
                keyResultId={keyResult.id}
                initiatives={keyResult.initiatives}
                owners={ownerOptions}
                canManage={canManageInitiatives}
                autoTracked={keyResult.autoUpdateFromInitiatives}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تاریخچه بازبینی‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckInTimeline checkIns={keyResult.checkIns} unit={keyResult.unit} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                دیدگاه‌ها <Num value={comments.length} className="text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommentThread
                comments={comments}
                targetKey="keyResultId"
                targetId={keyResult.id}
                currentUserId={context.user.id}
                canDeleteAny={context.membership.role === 'ADMIN'}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مشخصات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1.5 text-xs">مالک</p>
                <UserChip user={keyResult.owner} size="md" />
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-1.5 text-xs">امتیاز اطمینان</p>
                <ConfidenceMeter confidence={keyResult.confidence} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">وزن در محاسبه هدف</span>
                <span className="text-xs">
                  <Num value={keyResult.weight} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">مهلت</span>
                <span className="text-xs">
                  {formatDate(keyResult.dueDate, context.organization.calendarType, 'short')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">آخرین بازبینی</span>
                <span className="text-xs">
                  {formatDate(keyResult.lastCheckInAt, context.organization.calendarType, 'short')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>هدف مرتبط</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/objectives/${keyResult.objective.id}`}
                className="hover:bg-accent block rounded-lg border p-3 transition-colors"
              >
                <span className="block text-sm">{keyResult.objective.title}</span>
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
