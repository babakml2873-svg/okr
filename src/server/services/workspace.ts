import { randomBytes } from 'node:crypto'

import { buildQuarter, quarterStatusFor } from '@/lib/date'
import {
  departmentSchema,
  inviteMemberSchema,
  quarterSchema,
  teamSchema,
  updateMemberSchema,
  updateOrganizationSchema,
} from '@/lib/validation/schemas'
import {
  NotFoundError,
  requirePermission,
  ValidationError,
  type SessionContext,
} from '@/server/context'
import { prisma } from '@/server/db'

import { logActivity, notify } from './activity'

// --------------------------------------------------------------------------
// reads — available to every member, since the whole org is readable
// --------------------------------------------------------------------------

export async function listMembers(context: SessionContext) {
  requirePermission(context, 'objective:view')

  return prisma.membership.findMany({
    where: { organizationId: context.organization.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          jobTitle: true,
          lastLoginAt: true,
        },
      },
      department: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  })
}

/** Lightweight owner options for the objective and key-result forms. */
export async function listOwnerOptions(context: SessionContext) {
  const members = await prisma.membership.findMany({
    where: { organizationId: context.organization.id, status: 'ACTIVE' },
    select: { user: { select: { id: true, name: true, avatarUrl: true, jobTitle: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return members.map((member) => member.user)
}

export async function listDepartments(context: SessionContext) {
  return prisma.department.findMany({
    where: { organizationId: context.organization.id },
    include: {
      head: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { teams: true, memberships: true, objectives: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function listTeams(context: SessionContext) {
  return prisma.team.findMany({
    where: { organizationId: context.organization.id },
    include: {
      department: { select: { id: true, name: true, color: true } },
      lead: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { memberships: true, objectives: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function listQuarters(context: SessionContext) {
  return prisma.quarter.findMany({
    where: { organizationId: context.organization.id },
    include: { _count: { select: { objectives: true } } },
    orderBy: [{ year: 'desc' }, { quarterNumber: 'desc' }],
  })
}

/** The period to preselect: the active one, else the most recent. */
export async function getDefaultQuarter(context: SessionContext) {
  const active = await prisma.quarter.findFirst({
    where: { organizationId: context.organization.id, status: 'ACTIVE' },
  })
  if (active) return active

  return prisma.quarter.findFirst({
    where: { organizationId: context.organization.id },
    orderBy: [{ year: 'desc' }, { quarterNumber: 'desc' }],
  })
}

// --------------------------------------------------------------------------
// writes — admin only
// --------------------------------------------------------------------------

export async function updateOrganization(context: SessionContext, input: unknown) {
  requirePermission(context, 'organization:update')
  const data = updateOrganizationSchema.parse(input)

  return prisma.organization.update({
    where: { id: context.organization.id },
    data: { name: data.name, calendarType: data.calendarType },
  })
}

export async function inviteMember(context: SessionContext, input: unknown) {
  requirePermission(context, 'organization:manage_members')
  const data = inviteMemberSchema.parse(input)

  const existingMember = await prisma.membership.findFirst({
    where: { organizationId: context.organization.id, user: { email: data.email } },
    select: { id: true },
  })
  if (existingMember) {
    throw new ValidationError('این کاربر از قبل عضو سازمان است.', { email: ['عضو تکراری'] })
  }

  const token = randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  const invitation = await prisma.invitation.upsert({
    where: { organizationId_email: { organizationId: context.organization.id, email: data.email } },
    create: {
      organizationId: context.organization.id,
      email: data.email,
      role: data.role,
      departmentId: data.departmentId,
      teamId: data.teamId,
      invitedById: context.user.id,
      token,
      expiresAt,
    },
    update: {
      role: data.role,
      departmentId: data.departmentId,
      teamId: data.teamId,
      token,
      expiresAt,
      acceptedAt: null,
    },
  })

  // No mail transport is configured; the admin shares this link directly.
  return { invitation, inviteUrl: `/register?invitation=${invitation.token}` }
}

export async function revokeInvitation(context: SessionContext, invitationId: string) {
  requirePermission(context, 'organization:manage_members')

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, organizationId: context.organization.id },
  })
  if (!invitation) throw new NotFoundError('دعوت‌نامه یافت نشد.')

  await prisma.invitation.delete({ where: { id: invitation.id } })
}

export async function listInvitations(context: SessionContext) {
  requirePermission(context, 'organization:manage_members')

  return prisma.invitation.findMany({
    where: { organizationId: context.organization.id, acceptedAt: null },
    include: { invitedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateMember(context: SessionContext, input: unknown) {
  requirePermission(context, 'organization:manage_members')
  const data = updateMemberSchema.parse(input)

  const membership = await prisma.membership.findFirst({
    where: { id: data.membershipId, organizationId: context.organization.id },
  })
  if (!membership) throw new NotFoundError('عضو موردنظر یافت نشد.')

  // Never leave the workspace without an administrator.
  if (membership.role === 'ADMIN' && data.role !== 'ADMIN') {
    const adminCount = await prisma.membership.count({
      where: { organizationId: context.organization.id, role: 'ADMIN', status: 'ACTIVE' },
    })
    if (adminCount <= 1) {
      throw new ValidationError('سازمان باید حداقل یک مدیر سامانه داشته باشد.', {
        role: ['آخرین مدیر سامانه'],
      })
    }
  }

  const updated = await prisma.membership.update({
    where: { id: membership.id },
    data: {
      role: data.role,
      departmentId: data.departmentId,
      teamId: data.teamId,
      status: data.status,
    },
  })

  await prisma.$transaction(async (tx) => {
    await logActivity(tx, {
      organizationId: context.organization.id,
      actorId: context.user.id,
      action: 'UPDATED',
      entityType: 'MEMBER',
      entityId: updated.id,
      summary: 'دسترسی یک عضو را تغییر داد',
    })
    if (membership.role !== data.role) {
      await notify(tx, {
        organizationId: context.organization.id,
        userId: membership.userId,
        actorId: context.user.id,
        type: 'INVITATION',
        title: 'نقش شما تغییر کرد',
        link: '/settings/profile',
      })
    }
  })

  return updated
}

export async function createDepartment(context: SessionContext, input: unknown) {
  requirePermission(context, 'organization:manage_structure')
  const data = departmentSchema.parse(input)

  return prisma.department.create({
    data: {
      organizationId: context.organization.id,
      name: data.name,
      description: data.description || null,
      color: data.color,
      headId: data.headId,
    },
  })
}

export async function updateDepartment(context: SessionContext, id: string, input: unknown) {
  requirePermission(context, 'organization:manage_structure')
  const data = departmentSchema.parse(input)

  const existing = await prisma.department.findFirst({
    where: { id, organizationId: context.organization.id },
    select: { id: true },
  })
  if (!existing) throw new NotFoundError('دپارتمان یافت نشد.')

  return prisma.department.update({
    where: { id: existing.id },
    data: {
      name: data.name,
      description: data.description || null,
      color: data.color,
      headId: data.headId,
    },
  })
}

export async function deleteDepartment(context: SessionContext, id: string) {
  requirePermission(context, 'organization:manage_structure')

  const existing = await prisma.department.findFirst({
    where: { id, organizationId: context.organization.id },
    include: { _count: { select: { objectives: true, teams: true } } },
  })
  if (!existing) throw new NotFoundError('دپارتمان یافت نشد.')
  if (existing._count.objectives > 0 || existing._count.teams > 0) {
    throw new ValidationError('ابتدا اهداف و تیم‌های این دپارتمان را جابه‌جا یا حذف کنید.')
  }

  await prisma.department.delete({ where: { id: existing.id } })
}

export async function createTeam(context: SessionContext, input: unknown) {
  requirePermission(context, 'organization:manage_structure')
  const data = teamSchema.parse(input)

  const department = await prisma.department.findFirst({
    where: { id: data.departmentId, organizationId: context.organization.id },
    select: { id: true },
  })
  if (!department) throw new ValidationError('دپارتمان معتبر نیست.', { departmentId: ['نامعتبر'] })

  return prisma.team.create({
    data: {
      organizationId: context.organization.id,
      departmentId: department.id,
      name: data.name,
      description: data.description || null,
      leadId: data.leadId,
    },
  })
}

export async function updateTeam(context: SessionContext, id: string, input: unknown) {
  requirePermission(context, 'organization:manage_structure')
  const data = teamSchema.parse(input)

  const existing = await prisma.team.findFirst({
    where: { id, organizationId: context.organization.id },
    select: { id: true },
  })
  if (!existing) throw new NotFoundError('تیم یافت نشد.')

  return prisma.team.update({
    where: { id: existing.id },
    data: {
      name: data.name,
      description: data.description || null,
      departmentId: data.departmentId,
      leadId: data.leadId,
    },
  })
}

export async function deleteTeam(context: SessionContext, id: string) {
  requirePermission(context, 'organization:manage_structure')

  const existing = await prisma.team.findFirst({
    where: { id, organizationId: context.organization.id },
    include: { _count: { select: { objectives: true } } },
  })
  if (!existing) throw new NotFoundError('تیم یافت نشد.')
  if (existing._count.objectives > 0) {
    throw new ValidationError('ابتدا اهداف این تیم را جابه‌جا یا حذف کنید.')
  }

  await prisma.team.delete({ where: { id: existing.id } })
}

/** Add a planning period, deriving its dates from the org's calendar. */
export async function createQuarter(context: SessionContext, input: unknown) {
  requirePermission(context, 'organization:manage_quarters')
  const data = quarterSchema.parse(input)

  const definition = buildQuarter(data.year, data.quarterNumber, context.organization.calendarType)

  const existing = await prisma.quarter.findUnique({
    where: {
      organizationId_year_quarterNumber: {
        organizationId: context.organization.id,
        year: data.year,
        quarterNumber: data.quarterNumber,
      },
    },
    select: { id: true },
  })
  if (existing) throw new ValidationError('این کوارتر از قبل تعریف شده است.')

  return prisma.quarter.create({
    data: {
      organizationId: context.organization.id,
      year: definition.year,
      quarterNumber: definition.quarterNumber,
      label: definition.label,
      startDate: definition.startDate,
      endDate: definition.endDate,
      status: quarterStatusFor(definition),
    },
  })
}

/**
 * Recompute every period's status from the clock. Called when the settings
 * page loads so an org that has been idle shows the right "active" quarter.
 */
export async function refreshQuarterStatuses(context: SessionContext, now = new Date()) {
  const quarters = await prisma.quarter.findMany({
    where: { organizationId: context.organization.id },
    select: { id: true, startDate: true, endDate: true, status: true },
  })

  const stale = quarters.filter((quarter) => quarterStatusFor(quarter, now) !== quarter.status)
  if (stale.length === 0) return

  await prisma.$transaction(
    stale.map((quarter) =>
      prisma.quarter.update({
        where: { id: quarter.id },
        data: { status: quarterStatusFor(quarter, now) },
      }),
    ),
  )
}
