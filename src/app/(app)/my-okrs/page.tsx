import type { Metadata } from 'next'
import { AlertTriangle, ClipboardCheck, Target, TrendingUp } from 'lucide-react'

import { KeyResultRow } from '@/components/okr/key-result-row'
import { ObjectiveCard } from '@/components/okr/objective-card'
import { Num } from '@/components/shared/num'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/states'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { creatableLevels } from '@/lib/auth/permissions'
import { hasPermission, requireSessionContext } from '@/server/context'
import { listKeyResults } from '@/server/services/key-results'
import { listObjectives } from '@/server/services/objectives'
import {
  getDefaultQuarter,
  listDepartments,
  listOwnerOptions,
  listQuarters,
  listTeams,
} from '@/server/services/workspace'

import { KeyResultActions } from '../objectives/[id]/key-result-actions'
import { NewObjectiveButton } from '../objectives/objectives-client'

export const metadata: Metadata = { title: 'OKRهای من' }

export default async function MyOkrsPage({
  searchParams,
}: {
  searchParams: Promise<{ quarterId?: string }>
}) {
  const context = await requireSessionContext()
  const { quarterId } = await searchParams

  const defaultQuarter = await getDefaultQuarter(context)
  const activeQuarterId = quarterId ?? defaultQuarter?.id

  const [objectives, keyResults, quarters, departments, teams, owners] = await Promise.all([
    listObjectives(context, { ownerId: context.user.id, quarterId: activeQuarterId }),
    listKeyResults(context, { ownerId: context.user.id, quarterId: activeQuarterId }),
    listQuarters(context),
    listDepartments(context),
    listTeams(context),
    listOwnerOptions(context),
  ])

  const ownerOptions = owners.map((owner) => ({ id: owner.id, name: owner.name }))
  const averageProgress = keyResults.length
    ? Math.round(keyResults.reduce((acc, kr) => acc + kr.progress, 0) / keyResults.length)
    : 0
  const atRisk = keyResults.filter((kr) => kr.health !== 'ON_TRACK').length
  const notCheckedIn = keyResults.filter((kr) => !kr.lastCheckInAt).length

  const allObjectives = await listObjectives(context, { quarterId: activeQuarterId })
  const formOptions = {
    levels: creatableLevels(context.membership.role),
    owners: ownerOptions,
    departments: departments.map((d) => ({ id: d.id, name: d.name })),
    teams: teams.map((t) => ({ id: t.id, name: t.name, departmentId: t.department.id })),
    quarters: quarters.map((q) => ({ id: q.id, label: q.label })),
    parents: allObjectives.map((o) => ({ id: o.id, title: o.title, level: o.level })),
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="OKRهای من"
        description={`اهداف و نتایج کلیدی که مالک آن‌ها هستید — ${defaultQuarter?.label ?? ''}`}
        actions={
          <NewObjectiveButton
            options={{ ...formOptions, owners: ownerOptions }}
            defaultQuarterId={activeQuarterId}
            label="هدف فردی جدید"
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="اهداف من" value={objectives.length} icon={Target} />
        <StatCard label="نتایج کلیدی من" value={keyResults.length} icon={TrendingUp} tone="info" />
        <StatCard
          label="میانگین پیشرفت"
          value={averageProgress}
          variant="percent"
          icon={TrendingUp}
          tone={averageProgress >= 70 ? 'success' : averageProgress >= 30 ? 'warning' : 'danger'}
        />
        <StatCard
          label="نیازمند توجه"
          value={atRisk}
          icon={AlertTriangle}
          tone="danger"
          hint={notCheckedIn > 0 ? `${notCheckedIn} مورد بدون بازبینی` : undefined}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-4" />
            نتایج کلیدی من
            <Num value={keyResults.length} className="text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {keyResults.length === 0 ? (
            <EmptyState
              className="m-5 border-0"
              icon={TrendingUp}
              title="نتیجه کلیدی‌ای به شما واگذار نشده"
              description="وقتی مدیر شما نتیجه کلیدی‌ای به شما بدهد، اینجا نمایش داده می‌شود."
            />
          ) : (
            keyResults.map((keyResult) => (
              <KeyResultRow
                key={keyResult.id}
                keyResult={keyResult}
                showObjective
                objectiveTitle={keyResult.objective.title}
                actions={
                  <KeyResultActions
                    keyResult={{ ...keyResult, objectiveId: keyResult.objectiveId }}
                    owners={ownerOptions}
                    canUpdate={hasPermission(context, 'keyResult:update', {
                      organizationId: context.organization.id,
                      ownerId: keyResult.ownerId,
                    })}
                    canDelete={false}
                    canCheckIn={hasPermission(context, 'keyResult:checkIn', {
                      organizationId: context.organization.id,
                      ownerId: keyResult.ownerId,
                    })}
                  />
                }
              />
            ))
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold">اهداف من</h2>
        {objectives.length === 0 ? (
          <EmptyState
            icon={Target}
            title="هنوز هدفی ندارید"
            description="یک هدف فردی برای این کوارتر تعریف کنید و آن را با هدف تیم هم‌راستا کنید."
          />
        ) : (
          <div className="grid gap-3">
            {objectives.map((objective) => (
              <ObjectiveCard key={objective.id} objective={objective} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
