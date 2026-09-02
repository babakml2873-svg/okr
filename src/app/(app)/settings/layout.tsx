import { PageHeader } from '@/components/shared/page-header'
import { requireSessionContext } from '@/server/context'

import { SettingsNav } from './settings-nav'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const context = await requireSessionContext()

  return (
    <div className="space-y-6">
      <PageHeader
        title="تنظیمات"
        description={`مدیریت حساب کاربری و پیکربندی ${context.organization.name}`}
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <SettingsNav isAdmin={context.membership.role === 'ADMIN'} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
