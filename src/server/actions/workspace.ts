'use server'

import { revalidatePath } from 'next/cache'

import { updateProfileSchema, changePasswordSchema } from '@/lib/validation/schemas'
import { requireSessionContext, ValidationError } from '@/server/context'
import { hashPassword, verifyPassword } from '@/server/auth/password'
import { prisma } from '@/server/db'
import {
  createDepartment,
  createQuarter,
  createTeam,
  deleteDepartment,
  deleteTeam,
  inviteMember,
  revokeInvitation,
  updateDepartment,
  updateMember,
  updateOrganization,
  updateTeam,
} from '@/server/services/workspace'

import { runAction, type ActionResult } from './utils'

function revalidateSettings() {
  revalidatePath('/settings', 'layout')
  revalidatePath('/dashboard')
}

export async function updateOrganizationAction(input: unknown): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await updateOrganization(context, input)
  })
  if (result.ok) revalidatePath('/', 'layout')
  return result
}

export async function inviteMemberAction(
  input: unknown,
): Promise<ActionResult<{ inviteUrl: string }>> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    const { inviteUrl } = await inviteMember(context, input)
    return { inviteUrl }
  })
  if (result.ok) revalidateSettings()
  return result
}

export async function revokeInvitationAction(invitationId: string): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await revokeInvitation(context, invitationId)
  })
  if (result.ok) revalidateSettings()
  return result
}

export async function updateMemberAction(input: unknown): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await updateMember(context, input)
  })
  if (result.ok) revalidateSettings()
  return result
}

export async function createDepartmentAction(input: unknown): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await createDepartment(context, input)
  })
  if (result.ok) revalidateSettings()
  return result
}

export async function updateDepartmentAction(id: string, input: unknown): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await updateDepartment(context, id, input)
  })
  if (result.ok) revalidateSettings()
  return result
}

export async function deleteDepartmentAction(id: string): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await deleteDepartment(context, id)
  })
  if (result.ok) revalidateSettings()
  return result
}

export async function createTeamAction(input: unknown): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await createTeam(context, input)
  })
  if (result.ok) revalidateSettings()
  return result
}

export async function updateTeamAction(id: string, input: unknown): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await updateTeam(context, id, input)
  })
  if (result.ok) revalidateSettings()
  return result
}

export async function deleteTeamAction(id: string): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await deleteTeam(context, id)
  })
  if (result.ok) revalidateSettings()
  return result
}

export async function createQuarterAction(input: unknown): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    await createQuarter(context, input)
  })
  if (result.ok) revalidateSettings()
  return result
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const context = await requireSessionContext()
  const result = await runAction(async () => {
    const data = updateProfileSchema.parse(input)
    await prisma.user.update({
      where: { id: context.user.id },
      data: { name: data.name, jobTitle: data.jobTitle || null },
    })
  })
  if (result.ok) revalidatePath('/', 'layout')
  return result
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const context = await requireSessionContext()
  return runAction(async () => {
    const data = changePasswordSchema.parse(input)

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: context.user.id },
      select: { passwordHash: true },
    })
    if (!(await verifyPassword(data.currentPassword, user.passwordHash))) {
      throw new ValidationError('رمز عبور فعلی نادرست است.', {
        currentPassword: ['رمز عبور نادرست'],
      })
    }

    await prisma.user.update({
      where: { id: context.user.id },
      data: { passwordHash: await hashPassword(data.newPassword) },
    })
  })
}
