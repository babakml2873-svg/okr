import type { Metadata } from 'next'
import { Users } from 'lucide-react'

import { ObjectiveCard } from '@/components/okr/objective-card'
import { ProgressBar } from '@/components/okr/progress-bar'
import { Num } from '@/components/shared/num'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/states'
import { UserChip } from '@/components/shared/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { okrFilterSchema } from '@/lib/validation/schemas'
import { requireSessionContext } from '@/server/context'
import { listObjectives } from '@/server/services/objectives'
import {
  getDefaultQuarter,
  listDepartments,
  listMembers,
  listOwnerOptions,
  listQuarters,
} from '@/server/services/workspace'

import { OkrFilterBar } from '../objectives/objective-filters'

export const metadata: Metadata = { title: 'OKRهای تیم' }

export default async function TeamOkrsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const context = await requireSessionContext()
  const params = await searchParams

  const [quarters, departments, owners, members, defaultQuarter] = await Promise.all([
    listQuarters(context),
    listDepartments(context),
    listOwnerOptions(context),
    listMembers(context),
    getDefaultQuarter(context),
  ])

  // Default to the viewer's own department so the page opens on their team.
  const filter = okrFilterSchema.parse({
    ...params,
    quarterId: params.quarterId ?? defaultQuarter?.id,
    departmentId: params.departmentId ?? context.membership.departmentId ?? undefined,
    ownerId: params.owner ?? params.ownerId,
  })

  const objectives = await listObjectives(context, filter)

  const teammates = members.filter(
    (member) =>
      member.status === 'ACTIVE' &&
      (!filter.departmentId || member.departmentId === filter.departmentId),
  )

  const progressByOwner = new Map<string, number[]>()
  for (const objective of objectives) {
    const bucket = progressByOwner.get(objective.ownerId) ?? []
    bucket.push(objective.progress)
    progressByOwner.set(objective.ownerId, bucket)
  }

  const departmentName = departments.find((d) => d.id === filter.departmentId)?.name

  return (
    <div className="space-y-6">
      <PageHeader
        title="OKRهای تیم"
        description={
          departmentName
            ? `اهداف دپارتمان ${departmentName} و اعضای آن`
            : 'اهداف تیم‌ها و دپارتمان‌های سازمان'
        }
      />

      <OkrFilterBar
        options={{
          quarters: quarters.map((q) => ({ id: q.id, label: q.label })),
          departments: departments.map((d) => ({ id: d.id, name: d.name })),
          owners: owners.map((o) => ({ id: o.id, name: o.name })),
        }}
        include={['quarterId', 'departmentId', 'ownerId', 'level', 'health']}
      />

      {teammates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
              اعضا
              <Num value={teammates.length} className="text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teammates.map((member) => {
              const values = progressByOwner.get(member.userId) ?? []
              const average = values.length
                ? Math.round(values.reduce((acc, value) => acc + value, 0) / values.length)
                : 0
              return (
                <div key={member.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <UserChip user={member.user} size="md" />
                    <Badge variant="muted">
                      <Num value={values.length} /> هدف
                    </Badge>
                  </div>
                  <ProgressBar progress={average} size="sm" className="mt-3" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {objectives.length === 0 ? (
        <EmptyState
          icon={Users}
          title="هدفی برای این تیم یافت نشد"
          description="فیلترها را تغییر دهید یا از صفحه اهداف، هدف جدیدی برای این تیم بسازید."
          action={{ label: 'مشاهده اهداف', href: '/objectives' }}
        />
      ) : (
        <div className="grid gap-3">
          {objectives.map((objective) => (
            <ObjectiveCard key={objective.id} objective={objective} />
          ))}
        </div>
      )}
    </div>
  )
}
