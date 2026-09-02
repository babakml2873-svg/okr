'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { toPersianDigits } from '@/lib/format/numbers'
import type { OwnerPerformance } from '@/server/services/dashboard'

import { ChartFrame } from './chart-frame'
import { AXIS_PROPS, GRID_PROPS } from './chart-theme'
import { ChartTooltip } from './chart-tooltip'

/** Average progress of the OKRs each person owns. */
export function OwnerPerformanceChart({ data }: { data: OwnerPerformance[] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">داده‌ای برای نمایش نیست</p>
    )
  }

  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 38)}>
        <BarChart data={data} layout="vertical" margin={{ right: 8, left: 8, top: 4, bottom: 4 }}>
          <CartesianGrid {...GRID_PROPS} horizontal={false} vertical />
          <XAxis
            type="number"
            domain={[0, 100]}
            {...AXIS_PROPS}
            tickFormatter={(value: number) => toPersianDigits(value)}
          />
          <YAxis type="category" dataKey="name" width={100} {...AXIS_PROPS} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent)' }} />
          <Bar
            dataKey="progress"
            name="میانگین پیشرفت"
            fill="var(--chart-1)"
            radius={[0, 4, 4, 0]}
            barSize={14}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
