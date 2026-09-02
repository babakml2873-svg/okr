import { Num } from '@/components/shared/num'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/date'
import { formatMetricValue } from '@/lib/format/numbers'
import { cn } from '@/lib/utils'
import type { Report } from '@/server/services/reports'

import { ProgressBar } from './progress-bar'

const HEALTH_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'muted'> = {
  'در مسیر': 'success',
  'در معرض ریسک': 'warning',
  'خارج از مسیر': 'danger',
}

/**
 * The report body, shared by the on-screen view and the print view.
 *
 * `print-avoid-break` / `print-card` classes come from the print stylesheet in
 * globals.css — the same markup produces the PDF via the browser's print
 * dialog, so there is no second rendering path to keep in sync.
 */
export function ReportView({
  report,
  calendar,
}: {
  report: Report
  calendar: 'JALALI' | 'GREGORIAN'
}) {
  return (
    <div className="space-y-6">
      <header className="print-avoid-break">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {report.organizationName} · {report.subtitle}
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
            تاریخ تولید: {formatDate(report.generatedAt, calendar, 'long')}
          </p>
        </div>
      </header>

      <section className="print-avoid-break grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {report.summary.map((item) => (
          <Card key={item.label} className="print-card">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs">{item.label}</p>
              <p className="mt-1.5 text-xl font-bold">
                <Num value={item.value.replace('٪', '')} variant="raw" />
                {item.value.includes('٪') && '٪'}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {report.departmentBreakdown.length > 0 && (
        <Card className="print-card print-avoid-break">
          <CardHeader>
            <CardTitle>عملکرد دپارتمان‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>دپارتمان</TableHead>
                  <TableHead>تعداد اهداف</TableHead>
                  <TableHead>در معرض ریسک</TableHead>
                  <TableHead className="w-56">میانگین پیشرفت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.departmentBreakdown.map((department) => (
                  <TableRow key={department.name}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>
                      <Num value={department.objectiveCount} />
                    </TableCell>
                    <TableCell>
                      <span className={cn(department.atRisk > 0 && 'text-danger')}>
                        <Num value={department.atRisk} />
                      </span>
                    </TableCell>
                    <TableCell>
                      <ProgressBar progress={department.progress} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {report.ownerBreakdown.length > 0 && (
        <Card className="print-card print-avoid-break">
          <CardHeader>
            <CardTitle>عملکرد افراد</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام</TableHead>
                  <TableHead>اهداف</TableHead>
                  <TableHead>نتایج کلیدی</TableHead>
                  <TableHead className="w-56">میانگین پیشرفت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.ownerBreakdown.map((owner) => (
                  <TableRow key={owner.name}>
                    <TableCell className="font-medium">{owner.name}</TableCell>
                    <TableCell>
                      <Num value={owner.objectiveCount} />
                    </TableCell>
                    <TableCell>
                      <Num value={owner.keyResultCount} />
                    </TableCell>
                    <TableCell>
                      <ProgressBar progress={owner.progress} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="print-card print-break-before">
        <CardHeader>
          <CardTitle>
            جزئیات اهداف و نتایج کلیدی{' '}
            <Num value={report.rows.length} className="text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>هدف</TableHead>
                <TableHead>سطح</TableHead>
                <TableHead>مالک</TableHead>
                <TableHead>سلامت</TableHead>
                <TableHead>نتیجه کلیدی</TableHead>
                <TableHead>مقادیر</TableHead>
                <TableHead>پیشرفت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.map((row, index) => (
                <TableRow key={index} className="print-avoid-break">
                  <TableCell className="max-w-64 text-xs">{row.objective}</TableCell>
                  <TableCell>
                    <Badge variant="muted">{row.level}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{row.owner}</TableCell>
                  <TableCell>
                    <Badge variant={HEALTH_VARIANT[row.health] ?? 'muted'}>{row.health}</Badge>
                  </TableCell>
                  <TableCell className="max-w-64 text-xs">{row.keyResult ?? '—'}</TableCell>
                  <TableCell className="tabular text-xs whitespace-nowrap">
                    {row.keyResult
                      ? `${formatMetricValue(row.startValue, row.unit)} ← ${formatMetricValue(row.currentValue, row.unit)} ← ${formatMetricValue(row.targetValue, row.unit)}`
                      : '—'}
                  </TableCell>
                  <TableCell className="w-40">
                    <ProgressBar
                      progress={row.keyResultProgress ?? row.objectiveProgress}
                      size="sm"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
