import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSessionContext } from '@/server/context'
import { reportToWorkbook } from '@/server/services/excel'
import { buildReport, type ReportType } from '@/server/services/reports'

const REPORT_TYPES: ReportType[] = ['quarterly', 'department', 'individual']

export async function GET(request: NextRequest) {
  const context = await getSessionContext()
  if (!context) {
    return NextResponse.json({ error: 'برای دریافت گزارش باید وارد شوید.' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const type = (params.get('type') ?? 'quarterly') as ReportType
  if (!REPORT_TYPES.includes(type)) {
    return NextResponse.json({ error: 'نوع گزارش معتبر نیست.' }, { status: 400 })
  }

  const report = await buildReport(context, type, {
    quarterId: params.get('quarterId') ?? undefined,
    departmentId: params.get('departmentId') ?? undefined,
    ownerId: params.get('ownerId') ?? undefined,
  })

  const buffer = await reportToWorkbook(report)
  const filename = `okr-${type}-${report.generatedAt.toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
