import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileSpreadsheet, Printer } from 'lucide-react'

import { ReportView } from '@/components/okr/report-view'
import { FilterBar } from '@/components/shared/filter-bar'
import { Button } from '@/components/ui/button'
import { requireSessionContext } from '@/server/context'
import { buildReport, type ReportType } from '@/server/services/reports'
import { getDefaultQuarter } from '@/server/services/workspace'
import { listDepartments, listOwnerOptions, listQuarters } from '@/server/services/workspace'

const VALID_TYPES: ReportType[] = ['quarterly', 'department', 'individual']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>
}): Promise<Metadata> {
  const { type } = await params
  const titles: Record<string, string> = {
    quarterly: 'گزارش کوارتری',
    department: 'گزارش دپارتمان',
    individual: 'گزارش فردی',
  }
  return { title: titles[type] ?? 'گزارش' }
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>
  searchParams: Promise<{ quarterId?: string; departmentId?: string; ownerId?: string }>
}) {
  const { type } = await params
  const searchValues = await searchParams
  if (!VALID_TYPES.includes(type as ReportType)) notFound()

  const context = await requireSessionContext()
  // Reports open on the active quarter, matching every other OKR surface.
  const defaultQuarter = await getDefaultQuarter(context)
  const filter = { ...searchValues, quarterId: searchValues.quarterId ?? defaultQuarter?.id }

  const [report, quarters, departments, owners] = await Promise.all([
    buildReport(context, type as ReportType, filter),
    listQuarters(context),
    listDepartments(context),
    listOwnerOptions(context),
  ])

  const query = new URLSearchParams({
    type,
    ...(filter.quarterId ? { quarterId: filter.quarterId } : {}),
    ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
    ...(filter.ownerId ? { ownerId: filter.ownerId } : {}),
  })

  const printQuery = new URLSearchParams(query)
  printQuery.delete('type')

  const filterDefinitions = [
    {
      key: 'quarterId',
      label: 'کوارتر',
      allLabel: 'همه کوارترها',
      options: quarters.map((quarter) => ({ value: quarter.id, label: quarter.label })),
    },
    ...(type !== 'individual'
      ? [
          {
            key: 'departmentId',
            label: 'دپارتمان',
            allLabel: 'همه دپارتمان‌ها',
            options: departments.map((d) => ({ value: d.id, label: d.name })),
          },
        ]
      : []),
    ...(type !== 'department'
      ? [
          {
            key: 'ownerId',
            label: 'فرد',
            allLabel: 'همه افراد',
            options: owners.map((o) => ({ value: o.id, label: o.name })),
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <FilterBar filters={filterDefinitions} showSearch={false} />

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/reports/${type}/print?${printQuery.toString()}`} target="_blank">
              <Printer className="size-4" />
              چاپ / خروجی PDF
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href={`/api/exports/excel?${query.toString()}`}>
              <FileSpreadsheet className="size-4" />
              خروجی اکسل
            </a>
          </Button>
        </div>
      </div>

      <ReportView report={report} calendar={context.organization.calendarType} />
    </div>
  )
}
