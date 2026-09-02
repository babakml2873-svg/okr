import ExcelJS from 'exceljs'

import type { Report } from './reports'

/**
 * Render a report as an .xlsx workbook.
 *
 * Sheets are laid out right-to-left so the file opens the way a Persian reader
 * expects, and numbers are written as real numbers (not formatted strings) so
 * the recipient can pivot and chart them.
 */
export async function reportToWorkbook(report: Report): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = report.organizationName
  workbook.created = report.generatedAt

  const HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' },
  }

  function styleHeader(row: ExcelJS.Row) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    row.fill = HEADER_FILL
    row.alignment = { vertical: 'middle', horizontal: 'right' }
    row.height = 22
  }

  // ---------------------------------------------------------------- summary
  const summarySheet = workbook.addWorksheet('خلاصه', { views: [{ rightToLeft: true }] })
  summarySheet.columns = [
    { header: 'شاخص', key: 'label', width: 28 },
    { header: 'مقدار', key: 'value', width: 20 },
  ]
  styleHeader(summarySheet.getRow(1))

  summarySheet.addRow({ label: 'سازمان', value: report.organizationName })
  summarySheet.addRow({ label: 'عنوان گزارش', value: report.title })
  summarySheet.addRow({ label: 'دوره', value: report.subtitle })
  for (const item of report.summary) {
    summarySheet.addRow({ label: item.label, value: item.value })
  }

  // ------------------------------------------------------------------ detail
  const detailSheet = workbook.addWorksheet('جزئیات OKR', { views: [{ rightToLeft: true }] })
  detailSheet.columns = [
    { header: 'هدف', key: 'objective', width: 46 },
    { header: 'سطح', key: 'level', width: 12 },
    { header: 'مالک هدف', key: 'owner', width: 18 },
    { header: 'دپارتمان', key: 'department', width: 16 },
    { header: 'کوارتر', key: 'quarter', width: 14 },
    { header: 'وضعیت', key: 'status', width: 12 },
    { header: 'سلامت', key: 'health', width: 14 },
    { header: 'پیشرفت هدف (٪)', key: 'objectiveProgress', width: 16 },
    { header: 'نتیجه کلیدی', key: 'keyResult', width: 46 },
    { header: 'نوع متریک', key: 'metricType', width: 12 },
    { header: 'مقدار شروع', key: 'startValue', width: 14 },
    { header: 'مقدار فعلی', key: 'currentValue', width: 14 },
    { header: 'مقدار هدف', key: 'targetValue', width: 14 },
    { header: 'واحد', key: 'unit', width: 14 },
    { header: 'پیشرفت نتیجه کلیدی (٪)', key: 'keyResultProgress', width: 20 },
    { header: 'اطمینان', key: 'confidence', width: 10 },
    { header: 'آخرین بازبینی', key: 'lastCheckIn', width: 16 },
  ]
  styleHeader(detailSheet.getRow(1))
  detailSheet.autoFilter = { from: 'A1', to: 'Q1' }
  detailSheet.views = [{ rightToLeft: true, state: 'frozen', ySplit: 1 }]

  for (const row of report.rows) {
    detailSheet.addRow({ ...row, keyResult: row.keyResult ?? '—' })
  }

  // -------------------------------------------------------------- breakdowns
  const departmentSheet = workbook.addWorksheet('دپارتمان‌ها', { views: [{ rightToLeft: true }] })
  departmentSheet.columns = [
    { header: 'دپارتمان', key: 'name', width: 24 },
    { header: 'میانگین پیشرفت (٪)', key: 'progress', width: 20 },
    { header: 'تعداد اهداف', key: 'objectiveCount', width: 14 },
    { header: 'در معرض ریسک', key: 'atRisk', width: 16 },
  ]
  styleHeader(departmentSheet.getRow(1))
  for (const row of report.departmentBreakdown) departmentSheet.addRow(row)

  const ownerSheet = workbook.addWorksheet('افراد', { views: [{ rightToLeft: true }] })
  ownerSheet.columns = [
    { header: 'نام', key: 'name', width: 24 },
    { header: 'میانگین پیشرفت (٪)', key: 'progress', width: 20 },
    { header: 'تعداد اهداف', key: 'objectiveCount', width: 14 },
    { header: 'تعداد نتایج کلیدی', key: 'keyResultCount', width: 18 },
  ]
  styleHeader(ownerSheet.getRow(1))
  for (const row of report.ownerBreakdown) ownerSheet.addRow(row)

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
