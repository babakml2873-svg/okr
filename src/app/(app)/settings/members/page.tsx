import type { Metadata } from 'next'

import { requireSessionContext } from '@/server/context'
import {
  listDepartments,
  listInvitations,
  listMembers,
  listTeams,
} from '@/server/services/workspace'

import { AdminOnly } from '../admin-guard'
import { MembersManager } from './members-manager'

export const metadata: Metadata = { title: 'اعضا' }

export default async function MembersSettingsPage() {
  const context = await requireSessionContext()
  if (context.membership.role !== 'ADMIN') return <AdminOnly />

  const [members, invitations, departments, teams] = await Promise.all([
    listMembers(context),
    listInvitations(context),
    listDepartments(context),
    listTeams(context),
  ])

  return (
    <MembersManager
      currentUserId={context.user.id}
      members={members.map((member) => ({
        id: member.id,
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        avatarUrl: member.user.avatarUrl,
        jobTitle: member.user.jobTitle,
        role: member.role,
        status: member.status,
        departmentId: member.departmentId,
        teamId: member.teamId,
      }))}
      invitations={invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        invitedBy: invitation.invitedBy.name,
        expiresAt: invitation.expiresAt,
      }))}
      departments={departments.map((department) => ({ id: department.id, name: department.name }))}
      teams={teams.map((team) => ({
        id: team.id,
        name: team.name,
        departmentId: team.departmentId,
      }))}
    />
  )
}
