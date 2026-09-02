import {
  formatCompactNumber,
  formatNumber,
  formatPercent,
  toPersianDigits,
} from '@/lib/format/numbers'
import { cn } from '@/lib/utils'

type NumProps = {
  value: number | string | null | undefined
  /** `plain` groups thousands, `percent` appends ٪, `compact` shortens. */
  variant?: 'plain' | 'percent' | 'compact' | 'raw'
  unit?: string | null
  fractionDigits?: number
  className?: string
}

/**
 * Renders a number with Persian digits. Kept as a component so digit style and
 * tabular alignment stay consistent everywhere without repeating the helpers.
 */
export function Num({ value, variant = 'plain', unit, fractionDigits, className }: NumProps) {
  const numeric = typeof value === 'string' ? Number(value) : value

  let text: string
  if (variant === 'raw') text = toPersianDigits(value)
  else if (variant === 'percent') text = formatPercent(numeric, fractionDigits ?? 0)
  else if (variant === 'compact') text = formatCompactNumber(numeric)
  else text = formatNumber(numeric, { maximumFractionDigits: fractionDigits ?? 2 })

  return (
    <span className={cn('tabular', className)}>
      {text}
      {unit && variant !== 'percent' ? (
        <span className="text-muted-foreground ms-1 me-0 text-[0.9em]">{unit}</span>
      ) : null}
    </span>
  )
}
