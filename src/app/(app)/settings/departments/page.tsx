import type { Metadata } from 'next'

import { requireSessionContext } from '@/server/context'
import { listDepartments, listOwnerOptions } from '@/server/services/workspace'

import { AdminOnly } from '../admin-guard'
import { DepartmentsManager } from './departments-manager'

export const metadata: Metadata = { title: 'دپارتمان‌ها' }

export default async function DepartmentsSettingsPage() {
  const context = await requireSessionContext()
  if (context.membership.role !== 'ADMIN') return <AdminOnly />

  const [departments, owners] = await Promise.all([
    listDepartments(context),
    listOwnerOptions(context),
  ])

  return (
    <DepartmentsManager
      departments={departments.map((department) => ({
        id: department.id,
        name: department.name,
        description: department.description,
        color: department.color,
        headId: department.headId,
        teamCount: department._count.teams,
        memberCount: department._count.memberships,
        objectiveCount: department._count.objectives,
      }))}
      owners={owners.map((owner) => ({ id: owner.id, name: owner.name }))}
    />
  )
}
