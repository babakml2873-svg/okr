import { describe, expect, it } from 'vitest'

import {
  formatCompactNumber,
  formatMetricValue,
  formatNumber,
  formatPercent,
  formatRatio,
  parsePersianNumber,
  toLatinDigits,
  toPersianDigits,
} from './numbers'

describe('toPersianDigits', () => {
  it('converts ASCII digits', () => {
    expect(toPersianDigits(1404)).toBe('۱۴۰۴')
    expect(toPersianDigits('KR-12')).toBe('KR-۱۲')
  })

  it('handles empty input', () => {
    expect(toPersianDigits(null)).toBe('')
    expect(toPersianDigits(undefined)).toBe('')
    expect(toPersianDigits(0)).toBe('۰')
  })
})

describe('toLatinDigits', () => {
  it('converts Persian and Arabic digits back', () => {
    expect(toLatinDigits('۱۴۰۴')).toBe('1404')
    expect(toLatinDigits('١٢٣')).toBe('123')
    expect(toLatinDigits('mixed ۱2۳')).toBe('mixed 123')
  })
})

describe('parsePersianNumber', () => {
  it('parses Persian digits with separators', () => {
    expect(parsePersianNumber('۱٬۲۳۴')).toBe(1234)
    expect(parsePersianNumber('۱۲۳٬۴۵۶')).toBe(123456)
    expect(parsePersianNumber('۹۵')).toBe(95)
  })

  it('parses the Persian decimal separator', () => {
    expect(parsePersianNumber('۱۲٫۵')).toBe(12.5)
  })

  it('parses plain ASCII too', () => {
    expect(parsePersianNumber('1,500')).toBe(1500)
    expect(parsePersianNumber('12.5')).toBe(12.5)
  })

  it('round-trips what formatNumber produces', () => {
    expect(parsePersianNumber(formatNumber(1234567))).toBe(1234567)
  })

  it('returns null for blank or invalid input', () => {
    expect(parsePersianNumber('')).toBeNull()
    expect(parsePersianNumber(null)).toBeNull()
    expect(parsePersianNumber('abc')).toBeNull()
  })
})

describe('formatNumber', () => {
  it('groups thousands using Persian digits', () => {
    expect(formatNumber(1234567)).toBe('۱٬۲۳۴٬۵۶۷')
  })

  it('can emit ASCII digits for exports', () => {
    expect(formatNumber(1234567, { persianDigits: false })).toBe('1,234,567')
  })

  it('renders a dash for missing values', () => {
    expect(formatNumber(null)).toBe('—')
    expect(formatNumber(Number.NaN)).toBe('—')
  })
})

describe('formatPercent', () => {
  it('appends the Persian percent sign', () => {
    expect(formatPercent(62)).toBe('۶۲٪')
    expect(formatPercent(62.5, 1)).toBe('۶۲٫۵٪')
  })
})

describe('formatCompactNumber', () => {
  it('shortens large numbers into Persian words', () => {
    expect(formatCompactNumber(1_200_000)).toBe('۱٫۲ میلیون')
    expect(formatCompactNumber(2_500)).toBe('۲٫۵ هزار')
    expect(formatCompactNumber(3_000_000_000)).toBe('۳ میلیارد')
    expect(formatCompactNumber(940)).toBe('۹۴۰')
  })
})

describe('formatMetricValue', () => {
  it('hugs symbol units and spaces word units', () => {
    expect(formatMetricValue(95, '٪')).toBe('۹۵٪')
    expect(formatMetricValue(500, 'میلیون تومان')).toBe('۵۰۰ میلیون تومان')
    expect(formatMetricValue(100)).toBe('۱۰۰')
  })
})

describe('formatRatio', () => {
  it('renders «x از y»', () => {
    expect(formatRatio(8, 10)).toBe('۸ از ۱۰')
  })
})
