'use client'

import { Bell, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'

import { formatRelativeTime } from '@/lib/date'
import { toPersianDigits } from '@/lib/format/numbers'
import { markNotificationsReadAction } from '@/server/actions/okr'

import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

interface NotificationRow {
  id: string
  title: string
  body: string | null
  link: string | null
  readAt: string | null
  createdAt: string
}

export function NotificationsMenu({ initialUnread }: { initialUnread: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationRow[]>([])
  const [unread, setUnread] = useState(initialUnread)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/notifications')
      const payload = (await response.json()) as {
        data?: { items: NotificationRow[]; unread: number }
      }
      setItems(payload.data?.items ?? [])
      setUnread(payload.data?.unread ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  function markAllRead() {
    startTransition(async () => {
      await markNotificationsReadAction()
      setUnread(0)
      setItems((rows) => rows.map((row) => ({ ...row, readAt: new Date().toISOString() })))
      router.refresh()
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="اعلان‌ها">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="bg-danger text-primary-foreground absolute end-0 -top-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4">
              {toPersianDigits(unread > 9 ? '۹+' : unread)}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="text-sm font-semibold">اعلان‌ها</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} disabled={isPending}>
              <CheckCheck className="size-3.5" />
              خواندن همه
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <p className="text-muted-foreground p-6 text-center text-sm">در حال بارگذاری…</p>
          )}

          {!loading && items.length === 0 && (
            <p className="text-muted-foreground p-8 text-center text-sm">اعلان جدیدی ندارید</p>
          )}

          {items.map((item) => {
            const content = (
              <div className="hover:bg-accent flex gap-2.5 px-3 py-2.5 transition-colors">
                <span
                  className={
                    item.readAt
                      ? 'mt-1.5 size-1.5 shrink-0 rounded-full bg-transparent'
                      : 'bg-primary mt-1.5 size-1.5 shrink-0 rounded-full'
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{item.title}</span>
                  {item.body && (
                    <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs">
                      {item.body}
                    </span>
                  )}
                  <span className="text-muted-foreground mt-1 block text-[11px]">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </span>
              </div>
            )

            return item.link ? (
              <Link key={item.id} href={item.link} onClick={() => setOpen(false)} className="block">
                {content}
              </Link>
            ) : (
              <div key={item.id}>{content}</div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
