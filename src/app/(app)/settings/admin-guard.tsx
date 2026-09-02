import { ShieldAlert } from 'lucide-react'

import { EmptyState } from '@/components/shared/states'

/** Shown in place of an admin-only settings page for non-admins. */
export function AdminOnly() {
  return (
    <EmptyState
      icon={ShieldAlert}
      title="دسترسی محدود"
      description="فقط مدیر سامانه می‌تواند این بخش را ببیند و تغییر دهد."
      action={{ label: 'بازگشت به پروفایل', href: '/settings/profile' }}
    />
  )
}
