'use client'

import { Target } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

import { NAV_GROUP_LABELS, NAV_ITEMS, type NavItem } from './nav-items'

function isActive(pathname: string, href: string): boolean {
  if (href === '/settings/profile') return pathname.startsWith('/settings')
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  const groups = (['main', 'okr', 'insight', 'system'] as const).map((group) => ({
    group,
    items: NAV_ITEMS.filter((item) => item.group === group),
  }))

  return (
    <nav className="flex flex-col gap-6" aria-label="ناوبری اصلی">
      {groups.map(({ group, items }) => (
        <div key={group}>
          {NAV_GROUP_LABELS[group] && (
            <p className="text-muted-foreground mb-2 px-3 text-[11px] font-medium">
              {NAV_GROUP_LABELS[group]}
            </p>
          )}
          <ul className="space-y-0.5">
            {items.map((item: NavItem) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function Sidebar({ organizationName }: { organizationName: string }) {
  return (
    <aside className="bg-sidebar border-sidebar-border hidden w-60 shrink-0 flex-col border-e lg:flex">
      <div className="border-sidebar-border flex h-14 items-center gap-2.5 border-b px-4">
        <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Target className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{organizationName}</span>
          <span className="text-muted-foreground block text-[11px]">سامانه مدیریت OKR</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav />
      </div>
    </aside>
  )
}
