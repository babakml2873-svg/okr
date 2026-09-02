import type { Metadata } from 'next'

import { requireSessionContext } from '@/server/context'
import { listDepartments, listOwnerOptions, listTeams } from '@/server/services/workspace'

import { AdminOnly } from '../admin-guard'
import { TeamsManager } from './teams-manager'

export const metadata: Metadata = { title: 'تیم‌ها' }

export default async function TeamsSettingsPage() {
  const context = await requireSessionContext()
  if (context.membership.role !== 'ADMIN') return <AdminOnly />

  const [teams, departments, owners] = await Promise.all([
    listTeams(context),
    listDepartments(context),
    listOwnerOptions(context),
  ])

  return (
    <TeamsManager
      teams={teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        departmentId: team.departmentId,
        departmentName: team.department.name,
        leadId: team.leadId,
        memberCount: team._count.memberships,
        objectiveCount: team._count.objectives,
      }))}
      departments={departments.map((department) => ({ id: department.id, name: department.name }))}
      owners={owners.map((owner) => ({ id: owner.id, name: owner.name }))}
    />
  )
}
