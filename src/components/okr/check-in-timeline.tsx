import { ArrowLeft, ShieldAlert, Target } from 'lucide-react'

import { UserAvatar } from '@/components/shared/user-avatar'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/date'
import { CHECK_IN_CADENCE_LABELS } from '@/lib/okr'
import { formatMetricValue, formatPercent } from '@/lib/format/numbers'

import { ConfidenceMeter } from './confidence-meter'
import { HealthBadge } from './health-badge'

export interface TimelineCheckIn {
  id: string
  cadence: 'WEEKLY' | 'MONTHLY' | 'ADHOC'
  previousValue: number | null
  newValue: number | null
  previousProgress: number
  newProgress: number
  confidence: number
  health: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK'
  note: string | null
  blockers: string | null
  nextActions: string | null
  createdAt: Date | string
  author: { id: string; name: string; avatarUrl: string | null }
}

/** Chronological history of check-ins on a key result. */
export function CheckInTimeline({
  checkIns,
  unit,
}: {
  checkIns: TimelineCheckIn[]
  unit?: string | null
}) {
  if (checkIns.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">هنوز بازبینی‌ای ثبت نشده است</p>
    )
  }

  return (
    <ol className="relative space-y-5 ps-5">
      <span className="bg-border absolute start-1.5 top-2 bottom-2 w-px" aria-hidden />

      {checkIns.map((checkIn) => {
        const delta = Math.round((checkIn.newProgress - checkIn.previousProgress) * 10) / 10
        return (
          <li key={checkIn.id} className="relative">
            <span
              className="bg-card border-primary absolute -start-[1.31rem] top-1.5 size-3 rounded-full border-2"
              aria-hidden
            />

            <div className="flex flex-wrap items-center gap-2">
              <UserAvatar user={checkIn.author} size="sm" />
              <span className="text-sm font-medium">{checkIn.author.name}</span>
              <Badge variant="muted">{CHECK_IN_CADENCE_LABELS[checkIn.cadence]}</Badge>
              <HealthBadge health={checkIn.health} showIcon={false} />
              <span className="text-muted-foreground text-xs">
                {formatRelativeTime(checkIn.createdAt)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="tabular flex items-center gap-1.5">
                <Target className="text-muted-foreground size-3.5" />
                {formatMetricValue(checkIn.previousValue, unit)}
                <ArrowLeft className="text-muted-foreground size-3" />
                <span className="font-semibold">{formatMetricValue(checkIn.newValue, unit)}</span>
              </span>
              <span
                className={
                  delta > 0
                    ? 'text-success text-xs'
                    : delta < 0
                      ? 'text-danger text-xs'
                      : 'text-muted-foreground text-xs'
                }
              >
                {delta > 0 ? '+' : ''}
                {formatPercent(delta, 1)}
              </span>
              <ConfidenceMeter confidence={checkIn.confidence} />
            </div>

            {checkIn.note && <p className="mt-2 text-sm leading-relaxed">{checkIn.note}</p>}

            {checkIn.blockers && (
              <p className="text-danger mt-2 flex items-start gap-1.5 text-sm">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  <span className="font-medium">بلاکر: </span>
                  {checkIn.blockers}
                </span>
              </p>
            )}

            {checkIn.nextActions && (
              <p className="text-muted-foreground mt-1.5 text-sm">
                <span className="font-medium">اقدام بعدی: </span>
                {checkIn.nextActions}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
