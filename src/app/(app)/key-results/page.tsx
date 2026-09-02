import type { Metadata } from 'next'
import { TrendingUp } from 'lucide-react'

import { KeyResultRow } from '@/components/okr/key-result-row'
import { Num } from '@/components/shared/num'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/states'
import { Card, CardContent } from '@/components/ui/card'
import { okrFilterSchema } from '@/lib/validation/schemas'
import { hasPermission, requireSessionContext } from '@/server/context'
import { listKeyResults } from '@/server/services/key-results'
import {
  getDefaultQuarter,
  listDepartments,
  listOwnerOptions,
  listQuarters,
} from '@/server/services/workspace'

import { OkrFilterBar } from '../objectives/objective-filters'
import { KeyResultActions } from '../objectives/[id]/key-result-actions'

export const metadata: Metadata = { title: 'نتایج کلیدی' }

export default async function KeyResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const context = await requireSessionContext()
  const params = await searchParams

  const [quarters, departments, owners, defaultQuarter] = await Promise.all([
    listQuarters(context),
    listDepartments(context),
    listOwnerOptions(context),
    getDefaultQuarter(context),
  ])

  const filter = okrFilterSchema.parse({
    ...params,
    quarterId: params.quarterId ?? defaultQuarter?.id,
  })
  const keyResults = await listKeyResults(context, filter)
  const ownerOptions = owners.map((owner) => ({ id: owner.id, name: owner.name }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="نتایج کلیدی"
        description={
          <>
            <Num value={keyResults.length} /> نتیجه کلیدی در نمای فعلی — برای به‌روزرسانی مقدار،
            بازبینی ثبت کنید.
          </>
        }
      />

      <OkrFilterBar
        options={{
          quarters: quarters.map((quarter) => ({ id: quarter.id, label: quarter.label })),
          departments: departments.map((d) => ({ id: d.id, name: d.name })),
          owners: ownerOptions,
        }}
        include={['quarterId', 'departmentId', 'ownerId', 'health']}
        searchPlaceholder="جست‌وجو در نتایج کلیدی…"
      />

      {keyResults.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="نتیجه کلیدی‌ای یافت نشد"
          description="فیلترها را تغییر دهید یا از صفحه یک هدف، نتیجه کلیدی جدید اضافه کنید."
          action={{ label: 'مشاهده اهداف', href: '/objectives' }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            {keyResults.map((keyResult) => {
              const resource = {
                organizationId: context.organization.id,
                ownerId: keyResult.ownerId,
                parentOwnerId: keyResult.objective.ownerId,
                departmentId: keyResult.objective.departmentId,
                teamId: keyResult.objective.teamId,
                level: keyResult.objective.level,
              }
              return (
                <KeyResultRow
                  key={keyResult.id}
                  keyResult={keyResult}
                  showObjective
                  objectiveTitle={keyResult.objective.title}
                  actions={
                    <KeyResultActions
                      keyResult={{ ...keyResult, objectiveId: keyResult.objectiveId }}
                      owners={ownerOptions}
                      canUpdate={hasPermission(context, 'keyResult:update', resource)}
                      canDelete={hasPermission(context, 'keyResult:delete', resource)}
                      canCheckIn={hasPermission(context, 'keyResult:checkIn', resource)}
                    />
                  }
                />
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
