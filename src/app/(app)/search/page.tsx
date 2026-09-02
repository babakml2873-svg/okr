import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Search, Target, TrendingUp, User } from 'lucide-react'

import { FilterBar } from '@/components/shared/filter-bar'
import { Num } from '@/components/shared/num'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/states'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireSessionContext } from '@/server/context'
import { globalSearch, type SearchHit } from '@/server/services/search'

export const metadata: Metadata = { title: 'جست‌وجو' }

const GROUPS = [
  { type: 'OBJECTIVE', label: 'اهداف', icon: Target },
  { type: 'KEY_RESULT', label: 'نتایج کلیدی', icon: TrendingUp },
  { type: 'INITIATIVE', label: 'اقدامات', icon: FileText },
  { type: 'USER', label: 'افراد', icon: User },
] as const

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const context = await requireSessionContext()
  const { search } = await searchParams
  const query = search?.trim() ?? ''

  const hits: SearchHit[] = query.length >= 2 ? await globalSearch(context, query, 60) : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="جست‌وجوی سراسری"
        description="در اهداف، نتایج کلیدی، اقدامات و افراد سازمان جست‌وجو کنید."
      />

      <FilterBar filters={[]} searchPlaceholder="عبارت موردنظر را بنویسید…" />

      {query.length < 2 ? (
        <EmptyState
          icon={Search}
          title="عبارتی برای جست‌وجو وارد کنید"
          description="حداقل دو حرف بنویسید. می‌توانید از میانبر Ctrl+K هم استفاده کنید."
        />
      ) : hits.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`نتیجه‌ای برای «${query}» یافت نشد`}
          description="املای عبارت را بررسی کنید یا عبارت کوتاه‌تری امتحان کنید."
        />
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            <Num value={hits.length} /> نتیجه برای «{query}»
          </p>

          {GROUPS.map((group) => {
            const items = hits.filter((hit) => hit.type === group.type)
            if (items.length === 0) return null

            return (
              <Card key={group.type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <group.icon className="size-4" />
                    {group.label}
                    <Num value={items.length} className="text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-border divide-y">
                    {items.map((hit) => (
                      <li key={`${hit.type}-${hit.id}`}>
                        <Link
                          href={hit.href}
                          className="hover:bg-accent flex items-center gap-3 px-5 py-3 transition-colors"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{hit.title}</span>
                            {hit.subtitle && (
                              <span className="text-muted-foreground block truncate text-xs">
                                {hit.subtitle}
                              </span>
                            )}
                          </span>
                          {hit.progress !== undefined && (
                            <Num
                              value={hit.progress}
                              variant="percent"
                              className="text-muted-foreground shrink-0 text-sm"
                            />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
