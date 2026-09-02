import type { Role } from '@/lib/auth/permissions'

import { CommandPalette } from './command-palette'
import { MobileNav } from './mobile-nav'
import { NotificationsMenu } from './notifications-menu'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

export function Topbar({
  organizationName,
  user,
  role,
  unreadCount,
}: {
  organizationName: string
  user: { name: string; email: string; avatarUrl: string | null }
  role: Role
  unreadCount: number
}) {
  return (
    <header className="bg-background/85 border-border sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm">
      <MobileNav organizationName={organizationName} />

      <div className="flex-1">
        <CommandPalette />
      </div>

      <div className="flex items-center gap-0.5">
        <NotificationsMenu initialUnread={unreadCount} />
        <ThemeToggle />
        <UserMenu user={user} role={role} />
      </div>
    </header>
  )
}
