'use client'

import { Building2, CalendarRange, Layers, User, Users, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/settings/profile', label: 'پروفایل من', icon: User, adminOnly: false },
  { href: '/settings/organization', label: 'سازمان', icon: Building2, adminOnly: true },
  { href: '/settings/members', label: 'اعضا و دسترسی‌ها', icon: Users, adminOnly: true },
  { href: '/settings/departments', label: 'دپارتمان‌ها', icon: Layers, adminOnly: true },
  { href: '/settings/teams', label: 'تیم‌ها', icon: UsersRound, adminOnly: true },
  { href: '/settings/quarters', label: 'کوارترها', icon: CalendarRange, adminOnly: true },
]

export function SettingsNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const items = ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return (
    <nav aria-label="ناوبری تنظیمات">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
