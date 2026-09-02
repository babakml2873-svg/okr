'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { toPersianDigits } from '@/lib/format/numbers'
import type { ProgressTrendPoint } from '@/server/services/dashboard'

import { ChartFrame } from './chart-frame'
import { AXIS_PROPS, GRID_PROPS } from './chart-theme'
import { ChartTooltip } from './chart-tooltip'

/** Daily average progress over the recent past. */
export function ProgressTrendChart({
  data,
  height = 240,
}: {
  data: ProgressTrendPoint[]
  height?: number
}) {
  if (data.length < 2) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        برای رسم روند، حداقل دو بازبینی لازم است
      </p>
    )
  }

  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ right: 8, left: 8, top: 8, bottom: 4 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="label" {...AXIS_PROPS} minTickGap={24} reversed />
          <YAxis
            domain={[0, 100]}
            {...AXIS_PROPS}
            tickFormatter={(value: number) => toPersianDigits(value)}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="progress"
            name="میانگین پیشرفت"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
