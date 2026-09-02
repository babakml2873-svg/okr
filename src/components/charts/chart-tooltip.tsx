'use client'

import { toPersianDigits } from '@/lib/format/numbers'

interface TooltipPayloadItem {
  name?: string | number
  value?: number | string
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
}

/** Recharts tooltip rendered with the app's card styling and Persian digits. */
export function ChartTooltip({
  active,
  payload,
  label,
  suffix = '٪',
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  suffix?: string
}) {
  if (!active || !payload?.length) return null

  return (
    // The chart frame is LTR; the tooltip is prose, so it reads RTL again.
    <div
      dir="rtl"
      className="bg-popover border-border rounded-lg border px-3 py-2 text-xs shadow-md"
    >
      {label !== undefined && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((item, index) => (
        <p key={index} className="flex items-center gap-2">
          {item.color && (
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
          )}
          <span className="text-muted-foreground">{item.name}</span>
          <span className="tabular font-medium">
            {toPersianDigits(
              typeof item.value === 'number' ? Math.round(item.value) : (item.value ?? ''),
            )}
            {suffix}
          </span>
        </p>
      ))}
    </div>
  )
}
