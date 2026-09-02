import { notFound } from 'next/navigation'

import { ReportView } from '@/components/okr/report-view'
import { requireSessionContext } from '@/server/context'
import { buildReport, type ReportType } from '@/server/services/reports'
import { getDefaultQuarter } from '@/server/services/workspace'

import { PrintTrigger } from './print-trigger'

const VALID_TYPES: ReportType[] = ['quarterly', 'department', 'individual']

/**
 * The print view. Rendered outside the app shell (no sidebar or topbar) so
 * `Ctrl/Cmd+P` — or the browser's "Save as PDF" — produces a clean document
 * with correct Persian shaping and RTL layout.
 */
export default async function ReportPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>
  searchParams: Promise<{ quarterId?: string; departmentId?: string; ownerId?: string }>
}) {
  const { type } = await params
  if (!VALID_TYPES.includes(type as ReportType)) notFound()

  const context = await requireSessionContext()
  const searchValues = await searchParams
  const defaultQuarter = await getDefaultQuarter(context)
  const report = await buildReport(context, type as ReportType, {
    ...searchValues,
    quarterId: searchValues.quarterId ?? defaultQuarter?.id,
  })

  return (
    <div className="bg-background min-h-dvh px-6 py-8 print:px-0 print:py-0">
      <div className="mx-auto max-w-[1100px]">
        <PrintTrigger />
        <ReportView report={report} calendar={context.organization.calendarType} />
        <footer className="text-muted-foreground mt-8 border-t pt-4 text-center text-xs">
          تولیدشده توسط سامانه مدیریت OKR — {report.organizationName}
        </footer>
      </div>
    </div>
  )
}
