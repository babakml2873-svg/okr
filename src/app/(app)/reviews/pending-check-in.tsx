'use client'

import { ClipboardCheck } from 'lucide-react'
import { useState } from 'react'

import { CheckInDialog, type CheckInTarget } from '@/components/okr/check-in-dialog'
import { MetricValue } from '@/components/okr/metric-value'
import { ProgressBar } from '@/components/okr/progress-bar'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/date'

/** One row in the "needs a check-in this week" list. */
export function PendingCheckInRow({
  keyResult,
  objectiveTitle,
  lastCheckInAt,
}: {
  keyResult: CheckInTarget
  objectiveTitle: string
  lastCheckInAt: Date | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-border flex flex-col gap-3 border-b px-5 py-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{keyResult.title}</p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">{objectiveTitle}</p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <MetricValue
            metricType={keyResult.metricType}
            startValue={keyResult.startValue}
            currentValue={keyResult.currentValue}
            targetValue={keyResult.targetValue}
            unit={keyResult.unit}
          />
          <span className="text-muted-foreground text-xs">
            {lastCheckInAt
              ? `آخرین بازبینی ${formatRelativeTime(lastCheckInAt)}`
              : 'تاکنون بازبینی نشده'}
          </span>
        </div>
        <ProgressBar progress={keyResult.progress} size="sm" className="mt-2.5" />
      </div>

      <Button size="sm" onClick={() => setOpen(true)} className="shrink-0">
        <ClipboardCheck className="size-4" />
        ثبت بازبینی
      </Button>

      {open && <CheckInDialog open={open} onOpenChange={setOpen} keyResult={keyResult} />}
    </div>
  )
}
