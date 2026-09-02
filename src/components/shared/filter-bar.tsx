'use client'

import { Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'

import { cn } from '@/lib/utils'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterDefinition {
  /** Query-string key this filter writes to. */
  key: string
  label: string
  options: FilterOption[]
  allLabel?: string
}

/**
 * URL-driven filter bar.
 *
 * Filters live in the query string rather than component state, so a filtered
 * view is shareable, survives a refresh, and the server component re-renders
 * with the new data instead of the client refetching.
 */
export function FilterBar({
  filters,
  showSearch = true,
  searchPlaceholder = 'جست‌وجو…',
  className,
}: {
  filters: FilterDefinition[]
  showSearch?: boolean
  searchPlaceholder?: string
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  // Keep the input in step when the URL changes from elsewhere (e.g. reset).
  useEffect(() => {
    setSearch(searchParams.get('search') ?? '')
  }, [searchParams])

  const apply = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'all') params.delete(key)
        else params.set(key, value)
      }
      const query = params.toString()
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname))
    },
    [pathname, router, searchParams],
  )

  // Debounce the free-text search so typing doesn't hit the server per keystroke.
  useEffect(() => {
    const current = searchParams.get('search') ?? ''
    if (search === current) return
    const timer = setTimeout(() => apply({ search: search || null }), 350)
    return () => clearTimeout(timer)
  }, [search, searchParams, apply])

  const activeCount = filters.filter((filter) => searchParams.get(filter.key)).length
  const hasSearch = Boolean(searchParams.get('search'))

  return (
    <div className={cn('flex flex-wrap items-center gap-2', isPending && 'opacity-70', className)}>
      {showSearch && (
        <div className="relative min-w-48 flex-1 sm:max-w-72">
          <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="ps-9"
            aria-label="جست‌وجو"
          />
        </div>
      )}

      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={searchParams.get(filter.key) ?? 'all'}
          onValueChange={(value) => apply({ [filter.key]: value })}
        >
          <SelectTrigger className="w-auto min-w-36 gap-2" aria-label={filter.label}>
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{filter.allLabel ?? `همه ${filter.label}`}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {(activeCount > 0 || hasSearch) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch('')
            apply(Object.fromEntries([...filters.map((f) => [f.key, null]), ['search', null]]))
          }}
        >
          <X className="size-3.5" />
          پاک کردن فیلترها
        </Button>
      )}
    </div>
  )
}
