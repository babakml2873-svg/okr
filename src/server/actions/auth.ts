'use server'

import { AuthError } from 'next-auth'
import { unstable_rethrow } from 'next/navigation'

import { loginSchema, registerSchema } from '@/lib/validation/schemas'
import { signIn } from '@/server/auth'
import { hashPassword } from '@/server/auth/password'
import { prisma } from '@/server/db'
import { createOrganization } from '@/server/services/organization'

export interface ActionState {
  error?: string
  fieldErrors?: Record<string, string[]>
}

/** Sign in with email + password, then land on the dashboard. */
export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return {
      error: 'اطلاعات واردشده معتبر نیست.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    await signIn('credentials', { ...parsed.data, redirectTo: '/dashboard' })
    return {}
  } catch (error) {
    // `signIn` signals success by throwing a redirect — let that through.
    unstable_rethrow(error)
    if (error instanceof AuthError) {
      return { error: 'ایمیل یا رمز عبور نادرست است.' }
    }
    throw error
  }
}

/**
 * Register a new user. With an invitation token the user joins that
 * organization; otherwise a brand-new organization is created with the user as
 * its administrator.
 */
export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const invitationToken = (formData.get('invitationToken') as string | null) ?? undefined

  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    // An invited user joins an existing organization, so the field is not shown.
    organizationName: invitationToken ? 'سازمان' : formData.get('organizationName'),
    invitationToken,
  })

  if (!parsed.success) {
    return {
      error: 'لطفاً خطاهای فرم را برطرف کنید.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    return {
      error: 'کاربری با این ایمیل از قبل ثبت شده است.',
      fieldErrors: { email: ['این ایمیل تکراری است'] },
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash: await hashPassword(password) },
      })

      if (invitationToken) {
        const invitation = await tx.invitation.findUnique({ where: { token: invitationToken } })
        if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
          throw new Error('INVALID_INVITATION')
        }
        if (invitation.email !== email) {
          throw new Error('INVITATION_EMAIL_MISMATCH')
        }

        await tx.membership.create({
          data: {
            userId: user.id,
            organizationId: invitation.organizationId,
            role: invitation.role,
            departmentId: invitation.departmentId,
            teamId: invitation.teamId,
            status: 'ACTIVE',
          },
        })
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        })
      } else {
        await createOrganization({ name: parsed.data.organizationName, ownerUserId: user.id }, tx)
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_INVITATION') {
      return { error: 'دعوت‌نامه معتبر نیست یا منقضی شده است.' }
    }
    if (error instanceof Error && error.message === 'INVITATION_EMAIL_MISMATCH') {
      return { error: 'این دعوت‌نامه برای ایمیل دیگری صادر شده است.' }
    }
    throw error
  }

  await signIn('credentials', { email, password, redirectTo: '/dashboard' })
  return {}
}
