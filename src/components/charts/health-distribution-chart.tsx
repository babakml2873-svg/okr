'use client'

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { HEALTH_LABELS } from '@/lib/okr'
import { toPersianDigits } from '@/lib/format/numbers'
import type { HealthDistribution } from '@/server/services/dashboard'

import { HEALTH_COLORS } from './chart-theme'
import { ChartFrame } from './chart-frame'
import { ChartTooltip } from './chart-tooltip'

/** How the organization's objectives split across the three health states. */
export function HealthDistributionChart({ data }: { data: HealthDistribution[] }) {
  const rows = data
    .filter((row) => row.count > 0)
    .map((row) => ({ name: HEALTH_LABELS[row.health], value: row.count, health: row.health }))

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">داده‌ای برای نمایش نیست</p>
    )
  }

  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={2}
            strokeWidth={0}
          >
            {rows.map((row) => (
              <Cell key={row.health} fill={HEALTH_COLORS[row.health]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip suffix=" هدف" />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string, entry) => {
              const count = (entry?.payload as { value?: number } | undefined)?.value ?? 0
              return (
                <span className="text-xs">
                  {value}{' '}
                  <span className="tabular text-muted-foreground">({toPersianDigits(count)})</span>
                </span>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
