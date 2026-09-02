import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, CalendarRange, FileSpreadsheet, User } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireSessionContext } from '@/server/context'
import { getDefaultQuarter } from '@/server/services/workspace'

export const metadata: Metadata = { title: 'گزارش‌ها' }

const REPORTS = [
  {
    type: 'quarterly',
    title: 'گزارش کوارتری OKR',
    description:
      'نمای کامل اهداف و نتایج کلیدی یک کوارتر، همراه با میانگین پیشرفت، اهداف تکمیل‌شده و موارد در معرض ریسک.',
    icon: CalendarRange,
  },
  {
    type: 'department',
    title: 'گزارش عملکرد دپارتمان',
    description:
      'مقایسه عملکرد دپارتمان‌ها و ریز اهداف هر دپارتمان — مناسب جلسات مدیریتی و بازبینی فصلی.',
    icon: Building2,
  },
  {
    type: 'individual',
    title: 'گزارش عملکرد فردی',
    description:
      'کارنامه هر فرد بر اساس اهداف و نتایج کلیدی تحت مالکیت او — مناسب جلسات یک‌به‌یک و ارزیابی.',
    icon: User,
  },
] as const

export default async function ReportsPage() {
  const context = await requireSessionContext()
  const defaultQuarter = await getDefaultQuarter(context)
  const quarterQuery: Record<string, string> = defaultQuarter
    ? { quarterId: defaultQuarter.id }
    : {}

  return (
    <div className="space-y-6">
      <PageHeader
        title="گزارش‌ها"
        description="گزارش‌ها را روی صفحه ببینید، به‌صورت PDF چاپ کنید یا خروجی اکسل بگیرید."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {REPORTS.map((report) => (
          <Card key={report.type} className="flex flex-col">
            <CardHeader>
              <span className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
                <report.icon className="size-5" />
              </span>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription className="leading-relaxed">{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link
                  href={`/reports/${report.type}?${new URLSearchParams(quarterQuery).toString()}`}
                >
                  مشاهده گزارش
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a
                  href={`/api/exports/excel?${new URLSearchParams({ type: report.type, ...quarterQuery }).toString()}`}
                >
                  <FileSpreadsheet className="size-4" />
                  خروجی اکسل
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
