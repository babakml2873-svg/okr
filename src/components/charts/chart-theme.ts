/**
 * Shared chart styling.
 *
 * Recharts needs concrete colour values, so tokens are read from CSS custom
 * properties at render time — that keeps charts in step with the light/dark
 * theme instead of hard-coding two palettes.
 */

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const

export const HEALTH_COLORS = {
  ON_TRACK: 'var(--success)',
  AT_RISK: 'var(--warning)',
  OFF_TRACK: 'var(--danger)',
} as const

export const AXIS_PROPS = {
  tick: { fontSize: 11, fill: 'var(--muted-foreground)' },
  tickLine: false,
  axisLine: false,
} as const

export const GRID_PROPS = {
  stroke: 'var(--border)',
  strokeDasharray: '3 3',
  vertical: false,
} as const
