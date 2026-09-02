import { TooltipProvider } from '@/components/ui/tooltip'
import { requireSessionContext } from '@/server/context'

/**
 * Layout for printable documents.
 *
 * Deliberately outside the `(app)` group: a report destined for PDF must not
 * carry the sidebar, topbar or command palette. Authentication still applies.
 */
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireSessionContext()
  return <TooltipProvider>{children}</TooltipProvider>
}
