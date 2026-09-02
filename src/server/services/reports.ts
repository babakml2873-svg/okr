import { formatDate } from '@/lib/date'
import {
  HEALTH_LABELS,
  METRIC_TYPE_LABELS,
  OBJECTIVE_LEVEL_LABELS,
  OBJECTIVE_STATUS_LABELS,
} from '@/lib/okr'
import { requirePermission, type SessionContext } from '@/server/context'
import { prisma } from '@/server/db'

import { getDepartmentProgress, getOwnerPerformance } from './dashboard'

/**
 * Report assembly.
 *
 * Reports are plain data structures so the same payload drives the on-screen
 * report, the print view (which becomes the PDF) and the Excel export — the
 * three can't drift apart.
 */

export type ReportType = 'quarterly' | 'department' | 'individual'

export interface ReportRow {
  objective: string
  level: string
  owner: string
  department: string
  quarter: string
  status: string
  health: string
  objectiveProgress: number
  keyResult: string | null
  metricType: string | null
  startValue: number | null
  currentValue: number | null
  targetValue: number | null
  unit: string | null
  keyResultProgress: number | null
  confidence: number | null
  lastCheckIn: string | null
}

export interface ReportSummary {
  label: string
  value: string
}

export interface Report {
  type: ReportType
  title: string
  subtitle: string
  generatedAt: Date
  organizationName: string
  summary: ReportSummary[]
  rows: ReportRow[]
  departmentBreakdown: { name: string; progress: number; objectiveCount: number; atRisk: number }[]
  ownerBreakdown: {
    name: string
    progress: number
    objectiveCount: number
    keyResultCount: number
  }[]
}

export interface ReportFilter {
  quarterId?: string
  departmentId?: string
  ownerId?: string
}

/** Build one of the three reports, scoped to the caller's organization. */
export async function buildReport(
  context: SessionContext,
  type: ReportType,
  filter: ReportFilter = {},
): Promise<Report> {
  requirePermission(context, 'report:view')

  const calendar = context.organization.calendarType

  const objectives = await prisma.objective.findMany({
    where: {
      organizationId: context.organization.id,
      archivedAt: null,
      ...(filter.quarterId ? { quarterId: filter.quarterId } : {}),
      ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
      ...(filter.ownerId ? { ownerId: filter.ownerId } : {}),
    },
    include: {
      owner: { select: { name: true } },
      department: { select: { name: true } },
      quarter: { select: { label: true, startDate: true, endDate: true } },
      keyResults: {
        orderBy: { sortOrder: 'asc' },
        include: { owner: { select: { name: true } } },
      },
    },
    orderBy: [{ level: 'asc' }, { progress: 'desc' }],
  })

  const rows: ReportRow[] = []
  for (const objective of objectives) {
    const base = {
      objective: objective.title,
      level: OBJECTIVE_LEVEL_LABELS[objective.level],
      owner: objective.owner.name,
      department: objective.department?.name ?? '—',
      quarter: objective.quarter.label,
      status: OBJECTIVE_STATUS_LABELS[objective.status],
      health: HEALTH_LABELS[objective.health],
      objectiveProgress: Math.round(objective.progress),
    }

    if (objective.keyResults.length === 0) {
      rows.push({
        ...base,
        keyResult: null,
        metricType: null,
        startValue: null,
        currentValue: null,
        targetValue: null,
        unit: null,
        keyResultProgress: null,
        confidence: null,
        lastCheckIn: null,
      })
      continue
    }

    for (const keyResult of objective.keyResults) {
      rows.push({
        ...base,
        keyResult: keyResult.title,
        metricType: METRIC_TYPE_LABELS[keyResult.metricType],
        startValue: keyResult.startValue,
        currentValue: keyResult.currentValue,
        targetValue: keyResult.targetValue,
        unit: keyResult.unit,
        keyResultProgress: Math.round(keyResult.progress),
        confidence: keyResult.confidence,
        lastCheckIn: keyResult.lastCheckInAt
          ? formatDate(keyResult.lastCheckInAt, calendar, 'short')
          : null,
      })
    }
  }

  const [departmentBreakdown, ownerBreakdown] = await Promise.all([
    getDepartmentProgress(context, filter.quarterId),
    getOwnerPerformance(context, filter.quarterId, 50),
  ])

  const totalKeyResults = objectives.reduce((acc, o) => acc + o.keyResults.length, 0)
  const completed = objectives.filter((o) => o.status === 'COMPLETED').length
  const atRisk = objectives.filter(
    (o) => o.status === 'ACTIVE' && (o.health === 'AT_RISK' || o.health === 'OFF_TRACK'),
  ).length
  const averageProgress = objectives.length
    ? Math.round(objectives.reduce((acc, o) => acc + o.progress, 0) / objectives.length)
    : 0

  const quarterLabel = objectives[0]?.quarter.label ?? '—'
  const departmentName = filter.departmentId
    ? (departmentBreakdown.find((d) => d.id === filter.departmentId)?.name ?? '—')
    : null
  const ownerName = filter.ownerId
    ? (ownerBreakdown.find((o) => o.id === filter.ownerId)?.name ?? '—')
    : null

  const TITLES: Record<ReportType, string> = {
    quarterly: 'گزارش کوارتری OKR',
    department: 'گزارش عملکرد دپارتمان',
    individual: 'گزارش عملکرد فردی',
  }

  const SUBTITLES: Record<ReportType, string> = {
    quarterly: quarterLabel,
    department: `${departmentName ?? 'همه دپارتمان‌ها'} · ${quarterLabel}`,
    individual: `${ownerName ?? 'همه افراد'} · ${quarterLabel}`,
  }

  return {
    type,
    title: TITLES[type],
    subtitle: SUBTITLES[type],
    generatedAt: new Date(),
    organizationName: context.organization.name,
    summary: [
      { label: 'تعداد اهداف', value: String(objectives.length) },
      { label: 'تعداد نتایج کلیدی', value: String(totalKeyResults) },
      { label: 'میانگین پیشرفت', value: `${averageProgress}٪` },
      { label: 'اهداف تکمیل‌شده', value: String(completed) },
      { label: 'اهداف در معرض ریسک', value: String(atRisk) },
    ],
    rows,
    departmentBreakdown: departmentBreakdown.map((department) => ({
      name: department.name,
      progress: department.progress,
      objectiveCount: department.objectiveCount,
      atRisk: department.atRisk,
    })),
    ownerBreakdown: ownerBreakdown.map((owner) => ({
      name: owner.name,
      progress: owner.progress,
      objectiveCount: owner.objectiveCount,
      keyResultCount: owner.keyResultCount,
    })),
  }
}
