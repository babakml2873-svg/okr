/**
 * Planning periods.
 *
 * For a Jalali organization a "quarter" is a Persian season:
 *   Q1 بهار    1 Farvardin – 31 Khordad
 *   Q2 تابستان 1 Tir       – 31 Shahrivar
 *   Q3 پاییز   1 Mehr      – 30 Azar
 *   Q4 زمستان  1 Dey       – end of Esfand (29 or 30 in a leap year)
 */

import { toPersianDigits } from '@/lib/format/numbers'

import type { CalendarType } from './format'
import { fromJalali, fromJalaliEndOfDay, jalaliMonthLength, toJalali } from './jalali'

export interface QuarterDefinition {
  year: number
  quarterNumber: number
  label: string
  startDate: Date
  endDate: Date
}

export const JALALI_SEASON_NAMES = ['بهار', 'تابستان', 'پاییز', 'زمستان'] as const

/** Human label for a period, e.g. «بهار ۱۴۰۴» or «Q۲ ۲۰۲۶». */
export function quarterLabel(
  year: number,
  quarterNumber: number,
  calendar: CalendarType = 'JALALI',
): string {
  if (calendar === 'GREGORIAN') {
    return `Q${toPersianDigits(quarterNumber)} ${toPersianDigits(year)}`
  }
  const season = JALALI_SEASON_NAMES[quarterNumber - 1] ?? ''
  return `${season} ${toPersianDigits(year)}`
}

/** Short label for chart axes and dense chips, e.g. «بهار ۰۴». */
export function quarterShortLabel(
  year: number,
  quarterNumber: number,
  calendar: CalendarType = 'JALALI',
): string {
  if (calendar === 'GREGORIAN') return `Q${toPersianDigits(quarterNumber)}`
  const season = JALALI_SEASON_NAMES[quarterNumber - 1] ?? ''
  return `${season} ${toPersianDigits(String(year).slice(-2))}`
}

function jalaliQuarterBounds(year: number, quarterNumber: number): { start: Date; end: Date } {
  const firstMonth = (quarterNumber - 1) * 3 + 1
  const lastMonth = firstMonth + 2
  const start = fromJalali(year, firstMonth, 1)
  const end = fromJalaliEndOfDay(year, lastMonth, jalaliMonthLength(year, lastMonth))
  return { start, end }
}

function gregorianQuarterBounds(year: number, quarterNumber: number): { start: Date; end: Date } {
  const firstMonth = (quarterNumber - 1) * 3
  const start = new Date(Date.UTC(year, firstMonth, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, firstMonth + 3, 0, 23, 59, 59, 999))
  return { start, end }
}

/** Full definition of one planning period. */
export function buildQuarter(
  year: number,
  quarterNumber: number,
  calendar: CalendarType = 'JALALI',
): QuarterDefinition {
  if (quarterNumber < 1 || quarterNumber > 4) {
    throw new RangeError(`شماره کوارتر باید بین ۱ تا ۴ باشد: ${quarterNumber}`)
  }

  const { start, end } =
    calendar === 'GREGORIAN'
      ? gregorianQuarterBounds(year, quarterNumber)
      : jalaliQuarterBounds(year, quarterNumber)

  return {
    year,
    quarterNumber,
    label: quarterLabel(year, quarterNumber, calendar),
    startDate: start,
    endDate: end,
  }
}

/** All four periods of a year, in order. */
export function buildYearQuarters(
  year: number,
  calendar: CalendarType = 'JALALI',
): QuarterDefinition[] {
  return [1, 2, 3, 4].map((quarterNumber) => buildQuarter(year, quarterNumber, calendar))
}

/** Which period does this instant fall into? */
export function quarterOf(
  date: Date,
  calendar: CalendarType = 'JALALI',
): { year: number; quarterNumber: number } {
  if (calendar === 'GREGORIAN') {
    return { year: date.getUTCFullYear(), quarterNumber: Math.floor(date.getUTCMonth() / 3) + 1 }
  }
  const { jy, jm } = toJalali(date)
  return { year: jy, quarterNumber: Math.floor((jm - 1) / 3) + 1 }
}

/** The period containing "now" — the default filter on every OKR page. */
export function currentQuarter(
  calendar: CalendarType = 'JALALI',
  now: Date = new Date(),
): QuarterDefinition {
  const { year, quarterNumber } = quarterOf(now, calendar)
  return buildQuarter(year, quarterNumber, calendar)
}

/** Step forward or backward through periods, rolling the year over. */
export function shiftQuarter(
  year: number,
  quarterNumber: number,
  offset: number,
): { year: number; quarterNumber: number } {
  const zeroBased = (year * 4 + (quarterNumber - 1)) + offset
  return { year: Math.floor(zeroBased / 4), quarterNumber: (zeroBased % 4) + 1 }
}

export type QuarterStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED'

/** Derive a period's status from the clock. */
export function quarterStatusFor(
  quarter: Pick<QuarterDefinition, 'startDate' | 'endDate'>,
  now: Date = new Date(),
): QuarterStatus {
  if (now < quarter.startDate) return 'UPCOMING'
  if (now > quarter.endDate) return 'CLOSED'
  return 'ACTIVE'
}

/**
 * The check-in week containing `date`, as a UTC range. Iranian weeks start on
 * Saturday (JS day 6) and end on Friday.
 */
export function weekBoundsFor(date: Date): { start: Date; end: Date } {
  const day = date.getUTCDay()
  // Days since the most recent Saturday.
  const daysSinceSaturday = (day + 1) % 7
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - daysSinceSaturday),
  )
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
  return { start, end }
}
