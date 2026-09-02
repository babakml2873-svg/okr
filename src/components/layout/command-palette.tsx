'use client'

import { Command } from 'cmdk'
import { FileText, Search, Target, TrendingUp, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { toPersianDigits } from '@/lib/format/numbers'
import type { SearchHit } from '@/server/services/search'

import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'

const TYPE_ICON = {
  OBJECTIVE: Target,
  KEY_RESULT: TrendingUp,
  INITIATIVE: FileText,
  USER: User,
} as const

const TYPE_LABEL = {
  OBJECTIVE: 'اهداف',
  KEY_RESULT: 'نتایج کلیدی',
  INITIATIVE: 'اقدامات',
  USER: 'افراد',
} as const

/** ⌘K / Ctrl+K global search over objectives, key results, initiatives, people. */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setHits([])
      setLoading(false)
      return
    }

    setLoading(true)
    const id = ++requestId.current
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/v1/search?q=${encodeURIComponent(term)}&limit=16`)
        const payload = (await response.json()) as { data?: SearchHit[] }
        // Ignore responses from superseded keystrokes.
        if (id === requestId.current) setHits(payload.data ?? [])
      } catch {
        if (id === requestId.current) setHits([])
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    }, 220)

    return () => clearTimeout(timer)
  }, [query])

  const go = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery('')
      router.push(href)
    },
    [router],
  )

  const grouped = (['OBJECTIVE', 'KEY_RESULT', 'INITIATIVE', 'USER'] as const)
    .map((type) => ({ type, items: hits.filter((hit) => hit.type === type) }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <Button
        variant="outline"
        className="text-muted-foreground w-full max-w-64 justify-start gap-2 font-normal"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="flex-1 text-start">جست‌وجو…</span>
        <kbd className="bg-muted hidden rounded px-1.5 py-0.5 text-[10px] sm:inline">Ctrl K</kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">جست‌وجوی سراسری</DialogTitle>
          <DialogDescription className="sr-only">
            در اهداف، نتایج کلیدی، اقدامات و افراد جست‌وجو کنید
          </DialogDescription>

          <Command shouldFilter={false} loop>
            <div className="flex items-center gap-2 border-b px-4">
              <Search className="text-muted-foreground size-4 shrink-0" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="جست‌وجو در اهداف، نتایج کلیدی، اقدامات و افراد…"
                className="placeholder:text-muted-foreground h-12 w-full bg-transparent text-sm outline-none"
              />
            </div>

            <Command.List className="max-h-80 overflow-y-auto p-2">
              {loading && (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  در حال جست‌وجو…
                </div>
              )}

              {!loading && query.trim().length >= 2 && grouped.length === 0 && (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  نتیجه‌ای برای «{query}» یافت نشد
                </div>
              )}

              {!loading && query.trim().length < 2 && (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  برای شروع حداقل دو حرف بنویسید
                </div>
              )}

              {grouped.map((group) => {
                const Icon = TYPE_ICON[group.type]
                return (
                  <Command.Group
                    key={group.type}
                    heading={
                      <span className="text-muted-foreground px-2 text-[11px] font-medium">
                        {TYPE_LABEL[group.type]}
                      </span>
                    }
                  >
                    {group.items.map((hit) => (
                      <Command.Item
                        key={`${hit.type}-${hit.id}`}
                        value={`${hit.type}-${hit.id}`}
                        onSelect={() => go(hit.href)}
                        className="data-[selected=true]:bg-accent flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm"
                      >
                        <Icon className="text-muted-foreground size-4 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{hit.title}</span>
                          {hit.subtitle && (
                            <span className="text-muted-foreground block truncate text-xs">
                              {hit.subtitle}
                            </span>
                          )}
                        </span>
                        {hit.progress !== undefined && (
                          <span className="text-muted-foreground tabular shrink-0 text-xs">
                            {toPersianDigits(Math.round(hit.progress))}٪
                          </span>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )
              })}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
