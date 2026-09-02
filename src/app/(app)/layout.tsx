import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { requireSessionContext } from '@/server/context'
import { countUnreadNotifications } from '@/server/services/notifications'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await requireSessionContext()
  const unreadCount = await countUnreadNotifications(context)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-dvh">
        <Sidebar organizationName={context.organization.name} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            organizationName={context.organization.name}
            user={{
              name: context.user.name,
              email: context.user.email,
              avatarUrl: context.user.avatarUrl,
            }}
            role={context.membership.role}
            unreadCount={unreadCount}
          />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
