import { cn } from '@/lib/utils'

/**
 * Wrapper for every chart.
 *
 * Charts are rendered in an LTR box even though the app is RTL. SVG text
 * resolves `text-anchor` against the inherited writing direction, so an RTL
 * container makes Recharts' axis labels grow the wrong way and collide with
 * the plot area. Numeric axes read left-to-right anyway, so pinning the frame
 * to LTR is both correct and simpler than fighting per-tick anchors.
 * Persian labels still shape correctly inside it.
 */
export function ChartFrame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div dir="ltr" className={cn('w-full', className)}>
      {children}
    </div>
  )
}
