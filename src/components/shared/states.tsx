import { AlertCircle, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Skeleton } from '../ui/skeleton'

/** Shown when a list has no rows yet — always offers the next action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; href?: string; onClick?: () => void } | React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'border-border flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full">
          <Icon className="size-6" />
        </span>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5">
          {typeof action === 'object' && action !== null && 'label' in action ? (
            action.href ? (
              <Button asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button onClick={action.onClick}>{action.label}</Button>
            )
          ) : (
            action
          )}
        </div>
      )}
    </div>
  )
}

/** Shown when a server component or action fails. */
export function ErrorState({
  title = 'خطا در بارگذاری اطلاعات',
  description = 'مشکلی در دریافت اطلاعات پیش آمد. لطفاً دوباره تلاش کنید.',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <Card className={cn('border-destructive/30', className)}>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="bg-destructive/10 text-destructive flex size-11 items-center justify-center rounded-full">
          <AlertCircle className="size-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            تلاش مجدد
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-5 w-2/5" />
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-3 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} rows={2} />
      ))}
    </div>
  )
}

export function StatGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: count }, (_, index) => (
        <Card key={index}>
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <StatGridSkeleton />
      <ListSkeleton />
    </div>
  )
}
