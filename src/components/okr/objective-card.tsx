import { ChevronLeft, GitBranch, Target } from 'lucide-react'
import Link from 'next/link'

import { OBJECTIVE_LEVEL_LABELS } from '@/lib/okr'
import { toPersianDigits } from '@/lib/format/numbers'
import { cn } from '@/lib/utils'
import type { ObjectiveListItem } from '@/server/services/objectives'

import { UserChip } from '../shared/user-avatar'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { HealthBadge } from './health-badge'
import { ProgressBar } from './progress-bar'

const LEVEL_VARIANT = {
  COMPANY: 'default',
  DEPARTMENT: 'info',
  TEAM: 'secondary',
  INDIVIDUAL: 'muted',
} as const

/** The standard objective row used on the objectives, my-OKR and team pages. */
export function ObjectiveCard({
  objective,
  className,
}: {
  objective: ObjectiveListItem
  className?: string
}) {
  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={LEVEL_VARIANT[objective.level]}>
                {OBJECTIVE_LEVEL_LABELS[objective.level]}
              </Badge>
              {objective.department && (
                <Badge variant="outline">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: objective.department.color }}
                  />
                  {objective.department.name}
                </Badge>
              )}
              <HealthBadge health={objective.health} />
              {objective.status === 'COMPLETED' && <Badge variant="success">تکمیل‌شده</Badge>}
              {objective.status === 'DRAFT' && <Badge variant="muted">پیش‌نویس</Badge>}
            </div>

            <Link
              href={`/objectives/${objective.id}`}
              className="hover:text-primary block font-semibold transition-colors"
            >
              {objective.title}
            </Link>

            {objective.parent && (
              <p className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
                <GitBranch className="size-3" />
                هم‌راستا با: {objective.parent.title}
              </p>
            )}

            <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <UserChip user={objective.owner} subtitle={null} />
              <span className="flex items-center gap-1">
                <Target className="size-3.5" />
                {toPersianDigits(objective._count.keyResults)} نتیجه کلیدی
              </span>
              {objective._count.children > 0 && (
                <span className="flex items-center gap-1">
                  <GitBranch className="size-3.5" />
                  {toPersianDigits(objective._count.children)} هدف زیرمجموعه
                </span>
              )}
              <span>{objective.quarter.label}</span>
            </div>
          </div>

          <Link
            href={`/objectives/${objective.id}`}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label={`مشاهده ${objective.title}`}
          >
            <ChevronLeft className="size-5" />
          </Link>
        </div>

        <ProgressBar progress={objective.progress} size="md" className="mt-4" />
      </CardContent>
    </Card>
  )
}
