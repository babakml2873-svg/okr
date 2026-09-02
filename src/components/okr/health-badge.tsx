import { AlertTriangle, CircleAlert, CircleCheck } from 'lucide-react'

import { HEALTH_LABELS } from '@/lib/okr'
import { cn } from '@/lib/utils'

import { Badge } from '../ui/badge'

type Health = keyof typeof HEALTH_LABELS

const HEALTH_VARIANT = {
  ON_TRACK: 'success',
  AT_RISK: 'warning',
  OFF_TRACK: 'danger',
} as const

const HEALTH_ICON = {
  ON_TRACK: CircleCheck,
  AT_RISK: AlertTriangle,
  OFF_TRACK: CircleAlert,
} as const

export function HealthBadge({
  health,
  showIcon = true,
  className,
}: {
  health: Health
  showIcon?: boolean
  className?: string
}) {
  const Icon = HEALTH_ICON[health]
  return (
    <Badge variant={HEALTH_VARIANT[health]} className={cn(className)}>
      {showIcon && <Icon className="size-3" />}
      {HEALTH_LABELS[health]}
    </Badge>
  )
}
