import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, GitBranch, Target } from 'lucide-react'

import { CheckInTimeline } from '@/components/okr/check-in-timeline'
import { CommentThread } from '@/components/okr/comment-thread'
import { ConfidenceMeter } from '@/components/okr/confidence-meter'
import { HealthBadge } from '@/components/okr/health-badge'
import { KeyResultRow } from '@/components/okr/key-result-row'
import { ProgressBar } from '@/components/okr/progress-bar'
import { Num } from '@/components/shared/num'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/states'
import { UserChip } from '@/components/shared/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { creatableLevels } from '@/lib/auth/permissions'
import { formatDate, expectedProgressForQuarter } from '@/lib/date/objective-helpers'
import { OBJECTIVE_LEVEL_LABELS, OBJECTIVE_STATUS_LABELS, ROLLUP_MODE_LABELS } from '@/lib/okr'
import { hasPermission, NotFoundError, requireSessionContext } from '@/server/context'
import { listCheckIns } from '@/server/services/check-ins'
import { listComments } from '@/server/services/comments'
import { getObjective, listObjectives } from '@/server/services/objectives'
import {
  listDepartments,
  listOwnerOptions,
  listQuarters,
  listTeams,
} from '@/server/services/workspace'

import { KeyResultActions } from './key-result-actions'
import { ObjectiveActions } from './objective-actions'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const context = await requireSessionContext()
    const objective = await getObjective(context, (await params).id)
    return { title: objective.title }
  } catch {
    return { title: 'هدف' }
  }
}

export default async function ObjectiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireSessionContext()
  const { id } = await params

  let objective
  try {
    objective = await getObjective(context, id)
  } catch (error) {
    if (error instanceof NotFoundError) notFound()
    throw error
  }

  const [comments, checkIns, quarters, departments, teams, owners, siblings] = await Promise.all([
    listComments(context, { objectiveId: objective.id }),
    listCheckIns(context, { quarterId: undefined, take: 12 }),
    listQuarters(context),
    listDepartments(context),
    listTeams(context),
    listOwnerOptions(context),
    listObjectives(context, { quarterId: objective.quarterId }),
  ])

  const resource = {
    organizationId: objective.organizationId,
    ownerId: objective.ownerId,
    departmentId: objective.departmentId,
    teamId: objective.teamId,
    level: objective.level,
  }
  const canEdit = hasPermission(context, 'objective:update', resource)
  const canDelete = hasPermission(context, 'objective:delete', resource)
  const canAddKeyResult = hasPermission(context, 'keyResult:create', {
    ...resource,
    parentOwnerId: objective.ownerId,
  })

  const expected = expectedProgressForQuarter(objective.quarter)
  const objectiveCheckIns = checkIns.filter(
    (checkIn) => checkIn.keyResult?.objective.id === objective.id,
  )

  const formOptions = {
    levels: creatableLevels(context.membership.role),
    owners: owners.map((owner) => ({ id: owner.id, name: owner.name })),
    departments: departments.map((department) => ({ id: department.id, name: department.name })),
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      departmentId: team.department.id,
    })),
    quarters: quarters.map((quarter) => ({ id: quarter.id, label: quarter.label })),
    parents: siblings
      .filter((sibling) => sibling.id !== objective.id)
      .map((sibling) => ({ id: sibling.id, title: sibling.title, level: sibling.level })),
  }

  return (
    <div className="space-y-6">
      <nav className="text-muted-foreground flex items-center gap-1 text-sm" aria-label="مسیر">
        <Link href="/objectives" className="hover:text-foreground">
          اهداف
        </Link>
        <ChevronRight className="size-3.5 rotate-180" />
        <span className="text-foreground truncate">{objective.title}</span>
      </nav>

      <PageHeader
        title={objective.title}
        description={objective.description}
        actions={
          <ObjectiveActions
            objectiveId={objective.id}
            formOptions={formOptions}
            owners={owners.map((owner) => ({ id: owner.id, name: owner.name }))}
            canEdit={canEdit}
            canDelete={canDelete}
            canAddKeyResult={canAddKeyResult}
            initialValues={{
              id: objective.id,
              title: objective.title,
              description: objective.description ?? '',
              level: objective.level,
              ownerId: objective.ownerId,
              departmentId: objective.departmentId ?? '',
              teamId: objective.teamId ?? '',
              quarterId: objective.quarterId,
              parentId: objective.parentId ?? '',
              confidence: objective.confidence,
              rollupMode: objective.rollupMode,
            }}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge>{OBJECTIVE_LEVEL_LABELS[objective.level]}</Badge>
        <Badge variant="secondary">{OBJECTIVE_STATUS_LABELS[objective.status]}</Badge>
        <HealthBadge health={objective.health} />
        {objective.department && (
          <Badge variant="outline">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: objective.department.color }}
            />
            {objective.department.name}
          </Badge>
        )}
        {objective.team && <Badge variant="outline">{objective.team.name}</Badge>}
        <Badge variant="muted">{objective.quarter.label}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-sm font-medium">پیشرفت کلی</span>
                <span className="text-2xl font-bold">
                  <Num value={objective.progress} variant="percent" />
                </span>
              </div>
              <ProgressBar
                progress={objective.progress}
                expected={expected}
                size="lg"
                showValue={false}
              />
              <p className="text-muted-foreground mt-2 text-xs">
                پیشرفت مورد انتظار در این مقطع از کوارتر: <Num value={expected} variant="percent" />
                {' · '}
                روش محاسبه: {ROLLUP_MODE_LABELS[objective.rollupMode]}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>
                نتایج کلیدی{' '}
                <Num value={objective.keyResults.length} className="text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {objective.keyResults.length === 0 ? (
                <EmptyState
                  className="m-5 border-0"
                  icon={Target}
                  title="هنوز نتیجه کلیدی تعریف نشده"
                  description="یک هدف بدون نتیجه کلیدی قابل سنجش نیست. اولین نتیجه کلیدی را اضافه کنید."
                />
              ) : (
                objective.keyResults.map((keyResult) => {
                  const krResource = {
                    ...resource,
                    ownerId: keyResult.ownerId,
                    parentOwnerId: objective.ownerId,
                  }
                  return (
                    <KeyResultRow
                      key={keyResult.id}
                      keyResult={keyResult}
                      actions={
                        <KeyResultActions
                          keyResult={{ ...keyResult, objectiveId: objective.id }}
                          owners={owners.map((owner) => ({ id: owner.id, name: owner.name }))}
                          canUpdate={hasPermission(context, 'keyResult:update', krResource)}
                          canDelete={hasPermission(context, 'keyResult:delete', krResource)}
                          canCheckIn={hasPermission(context, 'keyResult:checkIn', krResource)}
                        />
                      }
                    />
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تاریخچه بازبینی‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckInTimeline checkIns={objectiveCheckIns} />
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
                targetKey="objectiveId"
                targetId={objective.id}
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
                <UserChip user={objective.owner} size="md" />
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-1.5 text-xs">امتیاز اطمینان</p>
                <ConfidenceMeter confidence={objective.confidence} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">بازه کوارتر</span>
                <span className="text-xs">
                  {formatDate(
                    objective.quarter.startDate,
                    context.organization.calendarType,
                    'short',
                  )}
                  {' — '}
                  {formatDate(
                    objective.quarter.endDate,
                    context.organization.calendarType,
                    'short',
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">ایجادکننده</span>
                <span className="text-xs">{objective.createdBy.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">تاریخ ایجاد</span>
                <span className="text-xs">
                  {formatDate(objective.createdAt, context.organization.calendarType, 'short')}
                </span>
              </div>
            </CardContent>
          </Card>

          {(objective.parent || objective.children.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="size-4" />
                  هم‌راستایی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {objective.parent && (
                  <div>
                    <p className="text-muted-foreground mb-1.5 text-xs">هدف والد</p>
                    <Link
                      href={`/objectives/${objective.parent.id}`}
                      className="hover:bg-accent block rounded-lg border p-2.5 transition-colors"
                    >
                      <span className="block text-sm">{objective.parent.title}</span>
                      <ProgressBar
                        progress={objective.parent.progress}
                        size="sm"
                        className="mt-2"
                      />
                    </Link>
                  </div>
                )}

                {objective.children.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1.5 text-xs">
                      اهداف زیرمجموعه (<Num value={objective.children.length} />)
                    </p>
                    <div className="space-y-2">
                      {objective.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/objectives/${child.id}`}
                          className="hover:bg-accent block rounded-lg border p-2.5 transition-colors"
                        >
                          <span className="block text-sm">{child.title}</span>
                          <span className="text-muted-foreground text-xs">{child.owner.name}</span>
                          <ProgressBar progress={child.progress} size="sm" className="mt-2" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
