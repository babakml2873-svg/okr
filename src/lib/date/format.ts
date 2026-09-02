/**
 * Date display helpers. Every user-facing date in the product goes through
 * here, so switching an organization's calendar changes one code path.
 */

import { toPersianDigits } from '@/lib/format/numbers'

import { jalaliMonthName, toJalali, WEEKDAY_NAMES } from './jalali'

export type CalendarType = 'JALALI' | 'GREGORIAN'

const GREGORIAN_FORMATTER = new Intl.DateTimeFormat('fa-IR-u-ca-gregory', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** «۱۴۰۴/۰۳/۱۵» */
export function formatJalaliShort(date: Date): string {
  const { jy, jm, jd } = toJalali(date)
  return toPersianDigits(`${jy}/${pad2(jm)}/${pad2(jd)}`)
}

/** «۱۵ خرداد ۱۴۰۴» */
export function formatJalaliLong(date: Date): string {
  const { jy, jm, jd } = toJalali(date)
  return `${toPersianDigits(jd)} ${jalaliMonthName(jm)} ${toPersianDigits(jy)}`
}

/** «۱۵ خرداد» — for dense lists where the year is implied. */
export function formatJalaliDayMonth(date: Date): string {
  const { jm, jd } = toJalali(date)
  return `${toPersianDigits(jd)} ${jalaliMonthName(jm)}`
}

/** «پنجشنبه ۱۵ خرداد ۱۴۰۴» */
export function formatJalaliWithWeekday(date: Date): string {
  return `${WEEKDAY_NAMES[date.getUTCDay()] ?? ''} ${formatJalaliLong(date)}`
}

export type DateStyle = 'short' | 'long' | 'dayMonth' | 'weekday'

/** Format a date according to the organization's calendar setting. */
export function formatDate(
  date: Date | string | null | undefined,
  calendar: CalendarType = 'JALALI',
  style: DateStyle = 'long',
): string {
  if (!date) return '—'
  const value = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(value.getTime())) return '—'

  if (calendar === 'GREGORIAN') {
    return GREGORIAN_FORMATTER.format(value)
  }

  switch (style) {
    case 'short':
      return formatJalaliShort(value)
    case 'dayMonth':
      return formatJalaliDayMonth(value)
    case 'weekday':
      return formatJalaliWithWeekday(value)
    case 'long':
    default:
      return formatJalaliLong(value)
  }
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** «۳ روز پیش» / «در ۲ هفته» — used by activity feeds and due dates. */
export function formatRelativeTime(
  date: Date | string | null | undefined,
  now: Date = new Date(),
): string {
  if (!date) return '—'
  const value = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(value.getTime())) return '—'

  const diff = value.getTime() - now.getTime()
  const past = diff < 0
  const abs = Math.abs(diff)

  const render = (amount: number, unit: string) =>
    past ? `${toPersianDigits(amount)} ${unit} پیش` : `${toPersianDigits(amount)} ${unit} دیگر`

  if (abs < MINUTE) return past ? 'لحظاتی پیش' : 'همین حالا'
  if (abs < HOUR) return render(Math.round(abs / MINUTE), 'دقیقه')
  if (abs < DAY) return render(Math.round(abs / HOUR), 'ساعت')
  if (abs < 7 * DAY) return render(Math.round(abs / DAY), 'روز')
  if (abs < 30 * DAY) return render(Math.round(abs / (7 * DAY)), 'هفته')
  if (abs < 365 * DAY) return render(Math.round(abs / (30 * DAY)), 'ماه')
  return render(Math.round(abs / (365 * DAY)), 'سال')
}

/** Whole days between two instants (positive when `to` is later). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY)
}

/** «۱۲ روز مانده» / «۳ روز گذشته» for due-date chips. */
export function formatDueDistance(dueDate: Date, now: Date = new Date()): string {
  const days = daysBetween(now, dueDate)
  if (days === 0) return 'امروز'
  if (days === 1) return 'فردا'
  if (days === -1) return 'دیروز'
  return days > 0
    ? `${toPersianDigits(days)} روز مانده`
    : `${toPersianDigits(Math.abs(days))} روز گذشته`
}

/** Value for an <input type="date">, always in the Gregorian ISO form. */
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return ''
  const value = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(value.getTime())) return ''
  return value.toISOString().slice(0, 10)
}
