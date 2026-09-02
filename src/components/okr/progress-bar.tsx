import { progressBand } from '@/lib/okr'
import { cn } from '@/lib/utils'

import { Num } from '../shared/num'

const BAND_BAR = {
  RED: 'bg-danger',
  YELLOW: 'bg-warning',
  GREEN: 'bg-success',
} as const

const BAND_TEXT = {
  RED: 'text-danger',
  YELLOW: 'text-warning',
  GREEN: 'text-success',
} as const

interface ProgressBarProps {
  progress: number
  /** Optional expected-pace marker, drawn as a tick on the track. */
  expected?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

/**
 * The product's progress bar. Colour follows the 0-30 / 30-70 / 70-100 band
 * rule from `progressBand`, so a bar and its badge can never disagree.
 */
export function ProgressBar({
  progress,
  expected,
  size = 'md',
  showValue = true,
  className,
}: ProgressBarProps) {
  const value = Math.max(0, Math.min(100, progress))
  const band = progressBand(value)

  return (
    <div className={cn('flex w-full min-w-0 items-center gap-2', className)}>
      {/* `flex-1 min-w-0` rather than `w-full`: the bar is often placed inside a
          narrow fixed-width column, where a percentage width would resolve
          against its own content and collapse to zero. */}
      <div
        className={cn(
          'bg-muted relative min-w-0 flex-1 overflow-hidden rounded-full',
          size === 'sm' && 'h-1.5',
          size === 'md' && 'h-2',
          size === 'lg' && 'h-3',
        )}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', BAND_BAR[band])}
          style={{ width: `${value}%` }}
        />
        {expected !== undefined && expected > 0 && expected < 100 && (
          <span
            className="bg-foreground/40 absolute top-0 h-full w-px"
            style={{ insetInlineStart: `${expected}%` }}
            title="پیشرفت مورد انتظار"
          />
        )}
      </div>

      {showValue && (
        <Num
          value={value}
          variant="percent"
          className={cn('w-12 shrink-0 text-end text-xs font-medium', BAND_TEXT[band])}
        />
      )}
    </div>
  )
}
