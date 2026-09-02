import Link from 'next/link'

import { formatDueDistance } from '@/lib/date'
import { METRIC_TYPE_LABELS } from '@/lib/okr'
import { cn } from '@/lib/utils'

import { UserAvatar } from '../shared/user-avatar'
import { Badge } from '../ui/badge'
import { ConfidenceMeter } from './confidence-meter'
import { HealthBadge } from './health-badge'
import { METRIC_ICON, MetricValue } from './metric-value'
import { ProgressBar } from './progress-bar'

interface KeyResultRowData {
  id: string
  title: string
  metricType: keyof typeof METRIC_TYPE_LABELS
  startValue: number
  currentValue: number
  targetValue: number
  unit: string | null
  progress: number
  confidence: number
  health: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK'
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  dueDate: Date | null
  owner: { id: string; name: string; avatarUrl: string | null }
}

/** One key result inside an objective, or on the key-results page. */
export function KeyResultRow({
  keyResult,
  showObjective,
  objectiveTitle,
  actions,
  className,
}: {
  keyResult: KeyResultRowData
  showObjective?: boolean
  objectiveTitle?: string
  actions?: React.ReactNode
  className?: string
}) {
  const Icon = METRIC_ICON[keyResult.metricType]

  return (
    <div
      className={cn(
        'border-border hover:bg-accent/40 flex flex-col gap-3 border-b px-4 py-3.5 transition-colors last:border-b-0 sm:px-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">
              <Link
                href={`/key-results/${keyResult.id}`}
                className="hover:text-primary block text-sm font-medium transition-colors"
              >
                {keyResult.title}
              </Link>
              {showObjective && objectiveTitle && (
                <p className="text-muted-foreground mt-0.5 truncate text-xs">{objectiveTitle}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {keyResult.status === 'COMPLETED' && <Badge variant="success">تکمیل</Badge>}
          <HealthBadge health={keyResult.health} showIcon={false} />
          <UserAvatar user={keyResult.owner} size="sm" />
          {actions}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 ps-6">
        <MetricValue
          metricType={keyResult.metricType}
          startValue={keyResult.startValue}
          currentValue={keyResult.currentValue}
          targetValue={keyResult.targetValue}
          unit={keyResult.unit}
        />
        <ConfidenceMeter confidence={keyResult.confidence} />
        {keyResult.dueDate && (
          <span className="text-muted-foreground text-xs">
            {formatDueDistance(new Date(keyResult.dueDate))}
          </span>
        )}
      </div>

      <ProgressBar progress={keyResult.progress} size="sm" className="ps-6" />
    </div>
  )
}
