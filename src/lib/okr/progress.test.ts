import { describe, expect, it } from 'vitest'

import {
  calculateKeyResultProgress,
  clampProgress,
  hasReachedTarget,
  valueForProgress,
} from './progress'

describe('clampProgress', () => {
  it('keeps values inside 0–100', () => {
    expect(clampProgress(-40)).toBe(0)
    expect(clampProgress(0)).toBe(0)
    expect(clampProgress(55.5)).toBe(55.5)
    expect(clampProgress(100)).toBe(100)
    expect(clampProgress(1200)).toBe(100)
  })

  it('treats non-finite input as zero', () => {
    expect(clampProgress(Number.NaN)).toBe(0)
    expect(clampProgress(Number.POSITIVE_INFINITY)).toBe(0)
    expect(clampProgress(Number.NEGATIVE_INFINITY)).toBe(0)
  })
})

describe('calculateKeyResultProgress — INCREASE', () => {
  const base = { metricType: 'INCREASE' } as const

  it('computes (current - start) / (target - start)', () => {
    // The spec example: active farms 20 → 100, currently 60.
    expect(calculateKeyResultProgress({ ...base, startValue: 20, currentValue: 60, targetValue: 100 })).toBe(50)
  })

  it('handles the revenue example 100M → 500M', () => {
    expect(
      calculateKeyResultProgress({
        ...base,
        startValue: 100_000_000,
        currentValue: 300_000_000,
        targetValue: 500_000_000,
      }),
    ).toBe(50)
  })

  it('is 0 at the starting value and 100 at the target', () => {
    expect(calculateKeyResultProgress({ ...base, startValue: 20, currentValue: 20, targetValue: 100 })).toBe(0)
    expect(calculateKeyResultProgress({ ...base, startValue: 20, currentValue: 100, targetValue: 100 })).toBe(100)
  })

  it('clamps overshoot and regression', () => {
    expect(calculateKeyResultProgress({ ...base, startValue: 20, currentValue: 300, targetValue: 100 })).toBe(100)
    expect(calculateKeyResultProgress({ ...base, startValue: 20, currentValue: 5, targetValue: 100 })).toBe(0)
  })

  it('supports negative ranges', () => {
    expect(calculateKeyResultProgress({ ...base, startValue: -50, currentValue: 0, targetValue: 50 })).toBe(50)
  })

  it('falls back to a reached/not-reached check when start equals target', () => {
    expect(calculateKeyResultProgress({ ...base, startValue: 10, currentValue: 10, targetValue: 10 })).toBe(100)
    expect(calculateKeyResultProgress({ ...base, startValue: 10, currentValue: 4, targetValue: 10 })).toBe(0)
  })

  it('rounds to two decimals', () => {
    expect(calculateKeyResultProgress({ ...base, startValue: 0, currentValue: 1, targetValue: 3 })).toBe(33.33)
  })
})

describe('calculateKeyResultProgress — DECREASE', () => {
  const base = { metricType: 'DECREASE' } as const

  it('computes (start - current) / (start - target)', () => {
    // The spec example: bug rate 10% → 2%, currently 6%.
    expect(calculateKeyResultProgress({ ...base, startValue: 10, currentValue: 6, targetValue: 2 })).toBe(50)
  })

  it('is 0 at the starting value and 100 at the target', () => {
    expect(calculateKeyResultProgress({ ...base, startValue: 10, currentValue: 10, targetValue: 2 })).toBe(0)
    expect(calculateKeyResultProgress({ ...base, startValue: 10, currentValue: 2, targetValue: 2 })).toBe(100)
  })

  it('clamps beyond the target and above the start', () => {
    expect(calculateKeyResultProgress({ ...base, startValue: 10, currentValue: 0, targetValue: 2 })).toBe(100)
    expect(calculateKeyResultProgress({ ...base, startValue: 10, currentValue: 14, targetValue: 2 })).toBe(0)
  })

  it('falls back to a reached check when start equals target', () => {
    expect(calculateKeyResultProgress({ ...base, startValue: 5, currentValue: 5, targetValue: 5 })).toBe(100)
    expect(calculateKeyResultProgress({ ...base, startValue: 5, currentValue: 9, targetValue: 5 })).toBe(0)
  })
})

describe('calculateKeyResultProgress — BINARY', () => {
  const base = { metricType: 'BINARY', startValue: 0, targetValue: 1 } as const

  it('is only ever 0 or 100', () => {
    expect(calculateKeyResultProgress({ ...base, currentValue: 0 })).toBe(0)
    expect(calculateKeyResultProgress({ ...base, currentValue: 1 })).toBe(100)
    expect(calculateKeyResultProgress({ ...base, currentValue: 0.9 })).toBe(0)
    expect(calculateKeyResultProgress({ ...base, currentValue: 7 })).toBe(100)
  })

  it('is not complete while sitting at the start value', () => {
    expect(
      calculateKeyResultProgress({ metricType: 'BINARY', startValue: 0, currentValue: 0, targetValue: 0 }),
    ).toBe(0)
  })
})

describe('calculateKeyResultProgress — MILESTONE', () => {
  const base = { metricType: 'MILESTONE', startValue: 0, targetValue: 5 } as const

  it('counts completed steps', () => {
    expect(calculateKeyResultProgress({ ...base, currentValue: 0 })).toBe(0)
    expect(calculateKeyResultProgress({ ...base, currentValue: 2 })).toBe(40)
    expect(calculateKeyResultProgress({ ...base, currentValue: 5 })).toBe(100)
  })
})

describe('calculateKeyResultProgress — invalid input', () => {
  it('returns 0 rather than NaN', () => {
    expect(
      calculateKeyResultProgress({
        metricType: 'INCREASE',
        startValue: Number.NaN,
        currentValue: 10,
        targetValue: 20,
      }),
    ).toBe(0)
  })
})

describe('valueForProgress', () => {
  it('inverts the increase formula', () => {
    expect(valueForProgress({ metricType: 'INCREASE', startValue: 20, targetValue: 100 }, 50)).toBe(60)
  })

  it('inverts the decrease formula', () => {
    expect(valueForProgress({ metricType: 'DECREASE', startValue: 10, targetValue: 2 }, 50)).toBe(6)
  })

  it('snaps binary key results to their end points', () => {
    expect(valueForProgress({ metricType: 'BINARY', startValue: 0, targetValue: 1 }, 100)).toBe(1)
    expect(valueForProgress({ metricType: 'BINARY', startValue: 0, targetValue: 1 }, 60)).toBe(0)
  })
})

describe('hasReachedTarget', () => {
  it('is true only at full progress', () => {
    expect(
      hasReachedTarget({ metricType: 'INCREASE', startValue: 0, currentValue: 100, targetValue: 100 }),
    ).toBe(true)
    expect(
      hasReachedTarget({ metricType: 'INCREASE', startValue: 0, currentValue: 99, targetValue: 100 }),
    ).toBe(false)
  })
})
