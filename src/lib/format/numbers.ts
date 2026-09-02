/**
 * Persian number and value formatting.
 *
 * Rendered digits are Persian (۰۱۲۳…) throughout the UI; the underlying data
 * stays plain JavaScript numbers.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const

/** Convert every ASCII digit in a string to its Persian counterpart. */
export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return ''
  return String(input).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit)
}

/** Convert Persian/Arabic digits back to ASCII — for parsing user input. */
export function toLatinDigits(input: string | null | undefined): string {
  if (!input) return ''
  return input.replace(/[۰-۹٠-٩]/g, (char) => {
    const persian = PERSIAN_DIGITS.indexOf(char as (typeof PERSIAN_DIGITS)[number])
    if (persian >= 0) return String(persian)
    const arabic = ARABIC_DIGITS.indexOf(char as (typeof ARABIC_DIGITS)[number])
    return arabic >= 0 ? String(arabic) : char
  })
}

/**
 * Parse a number typed by a Persian-speaking user.
 *
 * Accepts Persian/Arabic digits, the Persian thousands separator «٬» (U+066C),
 * the Arabic comma «،», the ASCII comma, and the Persian decimal separator
 * «٫» (U+066B) as well as the ASCII dot.
 */
export function parsePersianNumber(input: string | null | undefined): number | null {
  if (input === null || input === undefined) return null
  const normalised = toLatinDigits(String(input))
    .replace(/\u066B/g, '.') // Persian decimal separator
    .replace(/[\u066C\u060C,\s]/g, '') // thousands separators and spaces
    .trim()
  if (normalised === '') return null
  const value = Number(normalised)
  return Number.isFinite(value) ? value : null
}

export interface FormatNumberOptions {
  maximumFractionDigits?: number
  minimumFractionDigits?: number
  /** Emit Persian digits (default) or plain ASCII. */
  persianDigits?: boolean
}

/** Group-separated number in Persian digits, e.g. 1234567 → «۱٬۲۳۴٬۵۶۷». */
export function formatNumber(
  value: number | null | undefined,
  options: FormatNumberOptions = {},
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const { maximumFractionDigits = 2, minimumFractionDigits = 0, persianDigits = true } = options

  const formatted = new Intl.NumberFormat(persianDigits ? 'fa-IR' : 'en-US', {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value)

  return formatted
}

/** Percentage with no trailing «.00», e.g. 62.5 → «۶۲٫۵٪». */
export function formatPercent(value: number | null | undefined, fractionDigits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${formatNumber(value, { maximumFractionDigits: fractionDigits })}٪`
}

/** Compact form for dashboard tiles: 1_200_000 → «۱٫۲ میلیون». */
export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000)
    return `${formatNumber(value / 1_000_000_000, { maximumFractionDigits: 1 })} میلیارد`
  if (abs >= 1_000_000)
    return `${formatNumber(value / 1_000_000, { maximumFractionDigits: 1 })} میلیون`
  if (abs >= 1_000) return `${formatNumber(value / 1_000, { maximumFractionDigits: 1 })} هزار`
  return formatNumber(value)
}

/**
 * A metric value with its unit, e.g. 95 + «٪» → «۹۵٪», 500 + «میلیون تومان»
 * → «۵۰۰ میلیون تومان».
 */
export function formatMetricValue(value: number | null | undefined, unit?: string | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const formatted = formatNumber(value)
  if (!unit) return formatted
  const trimmed = unit.trim()
  // Symbol-like units hug the number; word-like units get a space.
  return /^[٪%°]/.test(trimmed) ? `${formatted}${trimmed}` : `${formatted} ${trimmed}`
}

/** «۳ از ۱۰» style ratio, used by the confidence meter. */
export function formatRatio(current: number, total: number): string {
  return `${toPersianDigits(current)} از ${toPersianDigits(total)}`
}
