import { confidenceBand } from '@/lib/okr'
import { toPersianDigits } from '@/lib/format/numbers'
import { cn } from '@/lib/utils'

const BAND_COLOR = {
  RED: 'bg-danger',
  YELLOW: 'bg-warning',
  GREEN: 'bg-success',
} as const

/** Ten segments, filled to the owner's declared confidence. */
export function ConfidenceMeter({
  confidence,
  showLabel = true,
  className,
}: {
  confidence: number
  showLabel?: boolean
  className?: string
}) {
  const value = Math.max(0, Math.min(10, Math.round(confidence)))
  const color = BAND_COLOR[confidenceBand(value)]

  return (
    <div className={cn('flex items-center gap-2', className)} title={`اطمینان ${value} از ۱۰`}>
      <div className="flex gap-0.5" aria-hidden>
        {Array.from({ length: 10 }, (_, index) => (
          <span
            key={index}
            className={cn('h-3 w-1 rounded-sm', index < value ? color : 'bg-muted')}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-muted-foreground tabular text-xs">
          {toPersianDigits(value)}
          <span className="opacity-60">/۱۰</span>
        </span>
      )}
      <span className="sr-only">امتیاز اطمینان {toPersianDigits(value)} از ۱۰</span>
    </div>
  )
}
