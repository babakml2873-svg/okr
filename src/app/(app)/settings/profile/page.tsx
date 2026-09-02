import type { Metadata } from 'next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/okr'
import { requireSessionContext } from '@/server/context'

import { ChangePasswordForm, ProfileForm } from './profile-forms'

export const metadata: Metadata = { title: 'پروفایل' }

export default async function ProfileSettingsPage() {
  const context = await requireSessionContext()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات شخصی</CardTitle>
          <CardDescription>نام و عنوان شغلی شما در سراسر سامانه نمایش داده می‌شود.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialName={context.user.name}
            initialJobTitle={context.user.jobTitle ?? ''}
            email={context.user.email}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>نقش و دسترسی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">سازمان</span>
            <span>{context.organization.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">نقش</span>
            <span className="font-medium">{ROLE_LABELS[context.membership.role]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">دپارتمان</span>
            <span>{context.membership.departmentName ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">تیم</span>
            <span>{context.membership.teamName ?? '—'}</span>
          </div>
          <p className="text-muted-foreground bg-muted/50 rounded-md p-3 text-xs leading-relaxed">
            {ROLE_DESCRIPTIONS[context.membership.role]}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تغییر رمز عبور</CardTitle>
          <CardDescription>رمز عبور جدید باید حداقل ۸ کاراکتر باشد.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
