import { describe, expect, it } from 'vitest'

import { toJalali } from './jalali'
import {
  buildQuarter,
  buildYearQuarters,
  currentQuarter,
  quarterLabel,
  quarterOf,
  quarterStatusFor,
  shiftQuarter,
  weekBoundsFor,
} from './quarters'

describe('buildQuarter — Jalali', () => {
  it('starts spring 1404 on Nowruz', () => {
    const q = buildQuarter(1404, 1)
    expect(q.startDate.toISOString()).toBe('2025-03-21T00:00:00.000Z')
    expect(toJalali(q.startDate)).toEqual({ jy: 1404, jm: 1, jd: 1 })
  })

  it('ends spring on the last day of Khordad', () => {
    expect(toJalali(buildQuarter(1404, 1).endDate)).toEqual({ jy: 1404, jm: 3, jd: 31 })
  })

  it('spans the right months for each season', () => {
    expect(toJalali(buildQuarter(1404, 2).startDate).jm).toBe(4)
    expect(toJalali(buildQuarter(1404, 2).endDate).jm).toBe(6)
    expect(toJalali(buildQuarter(1404, 3).startDate).jm).toBe(7)
    expect(toJalali(buildQuarter(1404, 3).endDate).jm).toBe(9)
    expect(toJalali(buildQuarter(1404, 4).startDate).jm).toBe(10)
    expect(toJalali(buildQuarter(1404, 4).endDate).jm).toBe(12)
  })

  it('ends winter on 29 Esfand in a common year and 30 in a leap year', () => {
    expect(toJalali(buildQuarter(1404, 4).endDate).jd).toBe(29)
    expect(toJalali(buildQuarter(1403, 4).endDate).jd).toBe(30)
  })

  it('labels quarters with Persian season names', () => {
    expect(buildQuarter(1404, 1).label).toBe('بهار ۱۴۰۴')
    expect(buildQuarter(1404, 4).label).toBe('زمستان ۱۴۰۴')
    expect(quarterLabel(1404, 2)).toBe('تابستان ۱۴۰۴')
    expect(quarterLabel(2026, 2, 'GREGORIAN')).toBe('Q۲ ۲۰۲۶')
  })

  it('leaves no gap between consecutive quarters', () => {
    const quarters = buildYearQuarters(1404)
    for (let i = 1; i < quarters.length; i += 1) {
      const previous = quarters[i - 1]!
      const current = quarters[i]!
      expect(current.startDate.getTime() - previous.endDate.getTime()).toBe(1)
    }
  })

  it('rejects quarter numbers outside 1–4', () => {
    expect(() => buildQuarter(1404, 0)).toThrow()
    expect(() => buildQuarter(1404, 5)).toThrow()
  })
})

describe('buildQuarter — Gregorian', () => {
  it('uses calendar quarters', () => {
    const q = buildQuarter(2026, 1, 'GREGORIAN')
    expect(q.startDate.toISOString()).toBe('2026-01-01T00:00:00.000Z')
    expect(q.endDate.toISOString()).toBe('2026-03-31T23:59:59.999Z')
  })
})

describe('quarterOf', () => {
  it('finds the Jalali season containing a date', () => {
    expect(quarterOf(new Date('2025-04-15T00:00:00Z'))).toEqual({ year: 1404, quarterNumber: 1 })
    expect(quarterOf(new Date('2025-11-15T00:00:00Z'))).toEqual({ year: 1404, quarterNumber: 3 })
    expect(quarterOf(new Date('2026-02-15T00:00:00Z'))).toEqual({ year: 1404, quarterNumber: 4 })
  })

  it('finds the Gregorian quarter containing a date', () => {
    expect(quarterOf(new Date('2026-05-15T00:00:00Z'), 'GREGORIAN')).toEqual({
      year: 2026,
      quarterNumber: 2,
    })
  })
})

describe('currentQuarter', () => {
  it('returns the period containing now', () => {
    const q = currentQuarter('JALALI', new Date('2025-05-01T00:00:00Z'))
    expect(q.year).toBe(1404)
    expect(q.quarterNumber).toBe(1)
  })
})

describe('shiftQuarter', () => {
  it('steps forward across a year boundary', () => {
    expect(shiftQuarter(1404, 4, 1)).toEqual({ year: 1405, quarterNumber: 1 })
  })

  it('steps backward across a year boundary', () => {
    expect(shiftQuarter(1404, 1, -1)).toEqual({ year: 1403, quarterNumber: 4 })
  })

  it('steps several quarters at once', () => {
    expect(shiftQuarter(1404, 1, 5)).toEqual({ year: 1405, quarterNumber: 2 })
  })
})

describe('quarterStatusFor', () => {
  const quarter = buildQuarter(1404, 1)

  it('is UPCOMING before it starts', () => {
    expect(quarterStatusFor(quarter, new Date('2025-01-01T00:00:00Z'))).toBe('UPCOMING')
  })

  it('is ACTIVE inside the window', () => {
    expect(quarterStatusFor(quarter, new Date('2025-05-01T00:00:00Z'))).toBe('ACTIVE')
  })

  it('is CLOSED afterwards', () => {
    expect(quarterStatusFor(quarter, new Date('2025-08-01T00:00:00Z'))).toBe('CLOSED')
  })
})

describe('weekBoundsFor', () => {
  it('starts the week on Saturday', () => {
    // 2025-05-07 is a Wednesday; its week starts Saturday 2025-05-03.
    const { start, end } = weekBoundsFor(new Date('2025-05-07T12:00:00Z'))
    expect(start.toISOString()).toBe('2025-05-03T00:00:00.000Z')
    expect(end.toISOString()).toBe('2025-05-09T23:59:59.999Z')
    expect(start.getUTCDay()).toBe(6)
  })

  it('keeps a Saturday in its own week', () => {
    const { start } = weekBoundsFor(new Date('2025-05-03T08:00:00Z'))
    expect(start.toISOString()).toBe('2025-05-03T00:00:00.000Z')
  })
})
