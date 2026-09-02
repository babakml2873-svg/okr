/**
 * Jalali (Solar Hijri) calendar support.
 *
 * Deliberately implemented against UTC parts rather than a date library that
 * reads the host timezone: quarter boundaries and report periods must be
 * identical whether the code runs on a laptop in Tehran, in CI, or on a
 * serverless host in UTC.
 *
 * Conversion uses the standard Birashk/Khayyam algorithm (as in jalaali-js).
 */

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
]

const div = (a: number, b: number) => Math.trunc(a / b)
const mod = (a: number, b: number) => a - Math.trunc(a / b) * b

export interface JalaliDate {
  jy: number
  jm: number
  jd: number
}

interface JalaliCalendarInfo {
  leap: number
  gy: number
  march: number
}

function jalCal(jy: number, withoutLeap: boolean): JalaliCalendarInfo {
  const bl = BREAKS.length
  const gy = jy + 621
  let leapJ = -14
  let jp = BREAKS[0] as number
  let jump = 0

  if (jy < jp || jy >= (BREAKS[bl - 1] as number)) {
    throw new RangeError(`سال شمسی خارج از بازه پشتیبانی‌شده است: ${jy}`)
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i] as number
    jump = jm - jp
    if (jy < jm) break
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }

  let n = jy - jp
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG

  let leap = 0
  if (!withoutLeap) {
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
    leap = mod(mod(n + 1, 33) - 1, 4)
    if (leap === -1) leap = 4
  }

  return { leap, gy, march }
}

/** Gregorian calendar date → Julian Day Number. */
function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

/** Julian Day Number → Gregorian calendar date. */
function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy, true)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

function d2j(jdn: number): JalaliDate {
  const gy = d2g(jdn).gy
  let jy = gy - 621
  const r = jalCal(jy, false)
  const jdn1f = g2d(gy, 3, r.march)
  let k = jdn - jdn1f

  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }

  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 }
}

/** Is this Jalali year a leap year (Esfand has 30 days)? */
export function isJalaliLeapYear(jy: number): boolean {
  return jalCal(jy, false).leap === 0
}

/** Number of days in a Jalali month. */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  return isJalaliLeapYear(jy) ? 30 : 29
}

/** UTC instant → Jalali year/month/day. */
export function toJalali(date: Date): JalaliDate {
  const jdn = g2d(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
  return d2j(jdn)
}

/** Jalali year/month/day → the UTC midnight instant of that day. */
export function fromJalali(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = d2g(j2d(jy, jm, jd))
  return new Date(Date.UTC(gy, gm - 1, gd, 0, 0, 0, 0))
}

/** Jalali year/month/day → the last millisecond of that day, in UTC. */
export function fromJalaliEndOfDay(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = d2g(j2d(jy, jm, jd))
  return new Date(Date.UTC(gy, gm - 1, gd, 23, 59, 59, 999))
}

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const

/** Persian weekday names, indexed by JS getUTCDay() (0 = Sunday). */
export const WEEKDAY_NAMES = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
] as const

export function jalaliMonthName(jm: number): string {
  return JALALI_MONTH_NAMES[jm - 1] ?? ''
}

/** Today's Jalali year — the default when creating a new planning cycle. */
export function currentJalaliYear(now: Date = new Date()): number {
  return toJalali(now).jy
}
