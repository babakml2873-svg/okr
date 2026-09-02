import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Flag } from 'lucide-react'

import { METRIC_TYPE_LABELS } from '@/lib/okr'
import { formatMetricValue } from '@/lib/format/numbers'
import { cn } from '@/lib/utils'

type MetricType = keyof typeof METRIC_TYPE_LABELS

export const METRIC_ICON = {
  INCREASE: ArrowUpRight,
  DECREASE: ArrowDownLeft,
  BINARY: CheckCircle2,
  MILESTONE: Flag,
} as const

/**
 * «۲۰ ← ۶۸ ← ۱۰۰» — start, current and target for a key result, rendered so
 * the reader can see the whole journey at a glance.
 */
export function MetricValue({
  metricType,
  startValue,
  currentValue,
  targetValue,
  unit,
  className,
}: {
  metricType: MetricType
  startValue: number
  currentValue: number
  targetValue: number
  unit?: string | null
  className?: string
}) {
  if (metricType === 'BINARY') {
    const done = currentValue >= targetValue && currentValue > startValue
    return (
      <span className={cn('text-sm', className)}>
        <span className={done ? 'text-success font-medium' : 'text-muted-foreground'}>
          {done ? 'انجام شد' : 'انجام نشده'}
        </span>
      </span>
    )
  }

  return (
    <span className={cn('tabular flex items-center gap-1.5 text-sm', className)} dir="rtl">
      <span className="text-muted-foreground">{formatMetricValue(startValue, unit)}</span>
      <span className="text-muted-foreground/60">←</span>
      <span className="font-semibold">{formatMetricValue(currentValue, unit)}</span>
      <span className="text-muted-foreground/60">←</span>
      <span className="text-muted-foreground">{formatMetricValue(targetValue, unit)}</span>
    </span>
  )
}
