'use client'

import { LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'

import { ROLE_LABELS } from '@/lib/okr'
import type { Role } from '@/lib/auth/permissions'
import { signOutAction } from '@/server/actions/session'

import { UserAvatar } from '../shared/user-avatar'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export function UserMenu({
  user,
  role,
}: {
  user: { name: string; email: string; avatarUrl: string | null }
  role: Role
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="منوی کاربر">
          <UserAvatar user={user} size="md" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium">{user.name}</span>
          <span className="text-muted-foreground block truncate text-xs" dir="ltr">
            {user.email}
          </span>
          <span className="text-primary mt-1 block text-xs">{ROLE_LABELS[role]}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/my-okrs">
            <User className="size-4" />
            OKRهای من
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <Settings className="size-4" />
            تنظیمات
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault()
            startTransition(() => {
              void signOutAction()
            })
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          {isPending ? 'در حال خروج…' : 'خروج از حساب'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
