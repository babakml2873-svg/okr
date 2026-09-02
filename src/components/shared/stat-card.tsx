import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Card, CardContent } from '../ui/card'
import { Num } from './num'

const TONE_STYLES = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/12 text-danger',
  info: 'bg-info/12 text-info',
} as const

/** A single dashboard metric tile. */
export function StatCard({
  label,
  value,
  variant = 'plain',
  unit,
  icon: Icon,
  tone = 'default',
  hint,
  className,
}: {
  label: string
  value: number
  variant?: 'plain' | 'percent' | 'compact'
  unit?: string
  icon?: LucideIcon
  tone?: keyof typeof TONE_STYLES
  hint?: string
  className?: string
}) {
  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          <p className="mt-2 text-2xl font-bold">
            <Num value={value} variant={variant} unit={unit} />
          </p>
          {hint && <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p>}
        </div>
        {Icon && (
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg',
              TONE_STYLES[tone],
            )}
          >
            <Icon className="size-4.5" />
          </span>
        )}
      </CardContent>
    </Card>
  )
}
