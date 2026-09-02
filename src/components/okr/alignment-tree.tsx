import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

import { OBJECTIVE_LEVEL_LABELS } from '@/lib/okr'
import { cn } from '@/lib/utils'
import type { AlignmentNode } from '@/server/services/objectives'

import { UserAvatar } from '../shared/user-avatar'
import { Badge } from '../ui/badge'
import { HealthBadge } from './health-badge'
import { ProgressBar } from './progress-bar'

const LEVEL_ACCENT = {
  COMPANY: 'border-s-primary',
  DEPARTMENT: 'border-s-info',
  TEAM: 'border-s-warning',
  INDIVIDUAL: 'border-s-muted-foreground',
} as const

/**
 * Renders the company → department → team → individual hierarchy.
 *
 * Indentation uses inline-start padding so the tree reads correctly in RTL
 * without any direction-specific branching.
 */
export function AlignmentTree({ nodes, depth = 0 }: { nodes: AlignmentNode[]; depth?: number }) {
  return (
    <ul className={cn('space-y-2', depth > 0 && 'mt-2 space-y-2 ps-4 sm:ps-8')}>
      {nodes.map(({ objective, children }) => (
        <li key={objective.id}>
          <Link
            href={`/objectives/${objective.id}`}
            className={cn(
              'bg-card hover:bg-accent/50 block rounded-lg border border-s-4 p-3 transition-colors',
              LEVEL_ACCENT[objective.level],
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="muted">{OBJECTIVE_LEVEL_LABELS[objective.level]}</Badge>
                  {objective.department && (
                    <Badge variant="outline">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: objective.department.color }}
                      />
                      {objective.department.name}
                    </Badge>
                  )}
                  <HealthBadge health={objective.health} showIcon={false} />
                </div>
                <p className="truncate text-sm font-medium">{objective.title}</p>
                <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                  <UserAvatar user={objective.owner} size="sm" />
                  <span>{objective.owner.name}</span>
                </div>
              </div>

              <div className="flex w-36 shrink-0 items-center gap-2 sm:w-44">
                <ProgressBar progress={objective.progress} size="sm" />
                <ChevronLeft className="text-muted-foreground size-4" />
              </div>
            </div>
          </Link>

          {children.length > 0 && (
            <div className="border-border relative ms-3 border-s">
              <AlignmentTree nodes={children} depth={depth + 1} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
