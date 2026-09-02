import { describe, expect, it } from 'vitest'

import {
  currentJalaliYear,
  fromJalali,
  fromJalaliEndOfDay,
  isJalaliLeapYear,
  jalaliMonthLength,
  jalaliMonthName,
  toJalali,
} from './jalali'

describe('toJalali', () => {
  it('maps Nowruz 1404 (21 March 2025)', () => {
    expect(toJalali(new Date('2025-03-21T00:00:00Z'))).toEqual({ jy: 1404, jm: 1, jd: 1 })
  })

  it('maps the day before Nowruz to the last day of Esfand 1403', () => {
    expect(toJalali(new Date('2025-03-20T00:00:00Z'))).toEqual({ jy: 1403, jm: 12, jd: 30 })
  })

  it('maps a mid-year date', () => {
    expect(toJalali(new Date('2025-09-23T00:00:00Z'))).toEqual({ jy: 1404, jm: 7, jd: 1 })
  })

  it('is timezone independent — it reads UTC parts only', () => {
    // Same instant, both sides of local midnight in +03:30.
    expect(toJalali(new Date('2025-03-21T23:30:00Z'))).toEqual({ jy: 1404, jm: 1, jd: 1 })
  })
})

describe('fromJalali', () => {
  it('is the inverse of toJalali', () => {
    for (const [jy, jm, jd] of [
      [1404, 1, 1],
      [1404, 6, 31],
      [1404, 7, 1],
      [1404, 12, 29],
      [1403, 12, 30],
      [1399, 4, 15],
    ] as const) {
      expect(toJalali(fromJalali(jy, jm, jd))).toEqual({ jy, jm, jd })
    }
  })

  it('produces UTC midnight', () => {
    expect(fromJalali(1404, 1, 1).toISOString()).toBe('2025-03-21T00:00:00.000Z')
  })
})

describe('fromJalaliEndOfDay', () => {
  it('produces the last millisecond of the day', () => {
    expect(fromJalaliEndOfDay(1404, 1, 1).toISOString()).toBe('2025-03-21T23:59:59.999Z')
  })
})

describe('isJalaliLeapYear', () => {
  it('identifies known leap years', () => {
    expect(isJalaliLeapYear(1403)).toBe(true)
    expect(isJalaliLeapYear(1408)).toBe(true)
  })

  it('identifies known common years', () => {
    expect(isJalaliLeapYear(1404)).toBe(false)
    expect(isJalaliLeapYear(1405)).toBe(false)
  })
})

describe('jalaliMonthLength', () => {
  it('gives 31 days to the first six months', () => {
    expect(jalaliMonthLength(1404, 1)).toBe(31)
    expect(jalaliMonthLength(1404, 6)).toBe(31)
  })

  it('gives 30 days to months seven through eleven', () => {
    expect(jalaliMonthLength(1404, 7)).toBe(30)
    expect(jalaliMonthLength(1404, 11)).toBe(30)
  })

  it('varies the length of Esfand with the leap year', () => {
    expect(jalaliMonthLength(1404, 12)).toBe(29)
    expect(jalaliMonthLength(1403, 12)).toBe(30)
  })
})

describe('jalaliMonthName', () => {
  it('returns Persian month names', () => {
    expect(jalaliMonthName(1)).toBe('فروردین')
    expect(jalaliMonthName(12)).toBe('اسفند')
    expect(jalaliMonthName(99)).toBe('')
  })
})

describe('currentJalaliYear', () => {
  it('reads the year of the given instant', () => {
    expect(currentJalaliYear(new Date('2025-06-01T00:00:00Z'))).toBe(1404)
  })
})
