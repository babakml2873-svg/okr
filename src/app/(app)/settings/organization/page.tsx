import type { Metadata } from 'next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireSessionContext } from '@/server/context'

import { AdminOnly } from '../admin-guard'
import { OrganizationForm } from './organization-form'

export const metadata: Metadata = { title: 'تنظیمات سازمان' }

export default async function OrganizationSettingsPage() {
  const context = await requireSessionContext()
  if (context.membership.role !== 'ADMIN') return <AdminOnly />

  return (
    <Card>
      <CardHeader>
        <CardTitle>اطلاعات سازمان</CardTitle>
        <CardDescription>
          نوع تقویم تعیین می‌کند کوارترها و تاریخ‌ها در کل سامانه چگونه محاسبه و نمایش داده شوند.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OrganizationForm
          initialName={context.organization.name}
          initialCalendarType={context.organization.calendarType}
          slug={context.organization.slug}
        />
      </CardContent>
    </Card>
  )
}
