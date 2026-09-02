import { describe, expect, it } from 'vitest'

import {
  calculateHealth,
  confidenceBand,
  elapsedRatio,
  expectedProgress,
  progressBand,
} from './health'

const START = new Date('2025-03-21T00:00:00Z')
const END = new Date('2025-06-21T00:00:00Z')
const MIDPOINT = new Date('2025-05-06T00:00:00Z')

describe('progressBand', () => {
  it('maps 0–30 to red', () => {
    expect(progressBand(0)).toBe('RED')
    expect(progressBand(29.99)).toBe('RED')
  })

  it('maps 30–70 to yellow', () => {
    expect(progressBand(30)).toBe('YELLOW')
    expect(progressBand(69.99)).toBe('YELLOW')
  })

  it('maps 70–100 to green', () => {
    expect(progressBand(70)).toBe('GREEN')
    expect(progressBand(100)).toBe('GREEN')
  })

  it('clamps out-of-range input', () => {
    expect(progressBand(-20)).toBe('RED')
    expect(progressBand(180)).toBe('GREEN')
  })
})

describe('elapsedRatio', () => {
  it('is 0 before the period and 1 after it', () => {
    expect(elapsedRatio(START, END, new Date('2025-01-01T00:00:00Z'))).toBe(0)
    expect(elapsedRatio(START, END, new Date('2025-12-01T00:00:00Z'))).toBe(1)
  })

  it('is about half at the midpoint', () => {
    expect(elapsedRatio(START, END, MIDPOINT)).toBeCloseTo(0.5, 1)
  })

  it('treats an empty period as fully elapsed', () => {
    expect(elapsedRatio(END, START)).toBe(1)
  })
})

describe('expectedProgress', () => {
  it('is the linear pace as a percentage', () => {
    expect(expectedProgress(START, END, MIDPOINT)).toBeCloseTo(50, 0)
  })
})

describe('calculateHealth', () => {
  const period = { periodStart: START, periodEnd: END, now: MIDPOINT }

  it('is ON_TRACK when keeping up with the pace', () => {
    expect(calculateHealth({ progress: 55, confidence: 8, ...period })).toBe('ON_TRACK')
    expect(calculateHealth({ progress: 42, confidence: 8, ...period })).toBe('ON_TRACK')
  })

  it('is AT_RISK when moderately behind', () => {
    expect(calculateHealth({ progress: 30, confidence: 7, ...period })).toBe('AT_RISK')
  })

  it('is OFF_TRACK when badly behind', () => {
    expect(calculateHealth({ progress: 5, confidence: 7, ...period })).toBe('OFF_TRACK')
  })

  it('always reports completed work as on track', () => {
    expect(calculateHealth({ progress: 100, confidence: 1, ...period })).toBe('ON_TRACK')
  })

  it('downgrades on-pace work when the owner has low confidence', () => {
    expect(calculateHealth({ progress: 55, confidence: 3, ...period })).toBe('AT_RISK')
    expect(calculateHealth({ progress: 55, confidence: 2, ...period })).toBe('OFF_TRACK')
  })

  it('is forgiving at the very start of a period', () => {
    expect(
      calculateHealth({
        progress: 0,
        confidence: 8,
        periodStart: START,
        periodEnd: END,
        now: START,
      }),
    ).toBe('ON_TRACK')
  })

  it('is unforgiving at the very end of a period', () => {
    expect(
      calculateHealth({
        progress: 40,
        confidence: 8,
        periodStart: START,
        periodEnd: END,
        now: END,
      }),
    ).toBe('OFF_TRACK')
  })
})

describe('confidenceBand', () => {
  it('splits 1–10 into three bands', () => {
    expect(confidenceBand(1)).toBe('RED')
    expect(confidenceBand(4)).toBe('RED')
    expect(confidenceBand(5)).toBe('YELLOW')
    expect(confidenceBand(7)).toBe('YELLOW')
    expect(confidenceBand(8)).toBe('GREEN')
    expect(confidenceBand(10)).toBe('GREEN')
  })
})
