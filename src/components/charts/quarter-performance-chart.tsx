'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { toPersianDigits } from '@/lib/format/numbers'
import type { QuarterPerformance } from '@/server/services/dashboard'

import { ChartFrame } from './chart-frame'
import { AXIS_PROPS, GRID_PROPS } from './chart-theme'
import { ChartTooltip } from './chart-tooltip'

/** Average objective progress per planning period. */
export function QuarterPerformanceChart({ data }: { data: QuarterPerformance[] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        هنوز کوارتر تکمیل‌شده‌ای برای مقایسه وجود ندارد
      </p>
    )
  }

  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ right: 8, left: 8, top: 8, bottom: 4 }}>
          <defs>
            <linearGradient id="quarterGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="label" {...AXIS_PROPS} />
          <YAxis
            domain={[0, 100]}
            {...AXIS_PROPS}
            tickFormatter={(value: number) => toPersianDigits(value)}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="progress"
            name="میانگین پیشرفت"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#quarterGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
