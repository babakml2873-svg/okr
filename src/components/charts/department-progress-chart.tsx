'use client'

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { toPersianDigits } from '@/lib/format/numbers'
import type { DepartmentProgress } from '@/server/services/dashboard'

import { ChartFrame } from './chart-frame'
import { AXIS_PROPS } from './chart-theme'
import { ChartTooltip } from './chart-tooltip'

/** Average objective progress per department. */
export function DepartmentProgressChart({ data }: { data: DepartmentProgress[] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">داده‌ای برای نمایش نیست</p>
    )
  }

  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 46)}>
        <BarChart data={data} layout="vertical" margin={{ right: 8, left: 8, top: 4, bottom: 4 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            {...AXIS_PROPS}
            tickFormatter={(value: number) => toPersianDigits(value)}
          />
          <YAxis type="category" dataKey="name" width={92} {...AXIS_PROPS} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent)' }} />
          <Bar dataKey="progress" name="پیشرفت" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((entry) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
