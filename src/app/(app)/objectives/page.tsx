import type { Metadata } from 'next'
import { Target } from 'lucide-react'

import { ObjectiveCard } from '@/components/okr/objective-card'
import { Num } from '@/components/shared/num'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/states'
import { creatableLevels } from '@/lib/auth/permissions'
import { okrFilterSchema } from '@/lib/validation/schemas'
import { hasPermission, requireSessionContext } from '@/server/context'
import { listObjectives } from '@/server/services/objectives'
import {
  getDefaultQuarter,
  listDepartments,
  listOwnerOptions,
  listQuarters,
  listTeams,
} from '@/server/services/workspace'

import { OkrFilterBar } from './objective-filters'
import { NewObjectiveButton } from './objectives-client'

export const metadata: Metadata = { title: 'اهداف' }

export default async function ObjectivesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const context = await requireSessionContext()
  const params = await searchParams

  const [quarters, departments, teams, owners, defaultQuarter] = await Promise.all([
    listQuarters(context),
    listDepartments(context),
    listTeams(context),
    listOwnerOptions(context),
    getDefaultQuarter(context),
  ])

  // Default to the active quarter so the page never opens on an empty list.
  const filter = okrFilterSchema.parse({
    ...params,
    quarterId: params.quarterId ?? defaultQuarter?.id,
  })

  const objectives = await listObjectives(context, filter)
  const canCreate = hasPermission(context, 'objective:create', {
    organizationId: context.organization.id,
    ownerId: context.user.id,
    level: 'INDIVIDUAL',
  })

  const allObjectives = await listObjectives(context, { quarterId: filter.quarterId })

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
    parents: allObjectives.map((objective) => ({
      id: objective.id,
      title: objective.title,
      level: objective.level,
    })),
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="اهداف"
        description={
          <>
            <Num value={objectives.length} /> هدف در نمای فعلی
          </>
        }
        actions={
          canCreate && (
            <NewObjectiveButton
              options={formOptions}
              defaultQuarterId={filter.quarterId ?? defaultQuarter?.id}
              defaultOpen={params.new === '1'}
            />
          )
        }
      />

      <OkrFilterBar
        options={{
          quarters: quarters.map((quarter) => ({ id: quarter.id, label: quarter.label })),
          departments: departments.map((d) => ({ id: d.id, name: d.name })),
          owners: owners.map((o) => ({ id: o.id, name: o.name })),
        }}
      />

      {objectives.length === 0 ? (
        <EmptyState
          icon={Target}
          title="هدفی با این فیلترها یافت نشد"
          description="فیلترها را تغییر دهید یا اولین هدف این کوارتر را ایجاد کنید."
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
