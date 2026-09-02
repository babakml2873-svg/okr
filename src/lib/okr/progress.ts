/**
 * Progress calculation engine.
 *
 * Pure functions with no I/O — the single source of truth for "how far along
 * is this?" across the whole product (UI, services, reports, exports).
 * Everything returns a number clamped to 0–100.
 */

export type MetricType = 'INCREASE' | 'DECREASE' | 'BINARY' | 'MILESTONE'

export interface MetricInput {
  metricType: MetricType
  startValue: number
  currentValue: number
  targetValue: number
}

/** Clamp to the 0–100 range and normalise -0 / NaN away. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value <= 0) return 0
  if (value >= 100) return 100
  return value
}

/** Round to two decimals so cached values stay stable across writes. */
export function roundProgress(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Progress for a single key result.
 *
 *   INCREASE   (current - start) / (target - start)
 *   DECREASE   (start - current) / (start - target)
 *   BINARY     0 or 100
 *   MILESTONE  completed steps / total steps (same shape as INCREASE)
 *
 * Degenerate ranges (target === start) can't produce a ratio, so they fall
 * back to "have we reached the target?" — 100 if yes, 0 if not.
 */
export function calculateKeyResultProgress(input: MetricInput): number {
  const { metricType, startValue, currentValue, targetValue } = input

  if (![startValue, currentValue, targetValue].every((n) => Number.isFinite(n))) {
    return 0
  }

  switch (metricType) {
    case 'BINARY':
      // Convention: start 0, target 1. Done only once the value has actually
      // moved past the starting point and reached the target.
      return currentValue >= targetValue && currentValue > startValue ? 100 : 0

    case 'DECREASE': {
      const range = startValue - targetValue
      if (range === 0) return currentValue <= targetValue ? 100 : 0
      return roundProgress(clampProgress(((startValue - currentValue) / range) * 100))
    }

    case 'INCREASE':
    case 'MILESTONE':
    default: {
      const range = targetValue - startValue
      if (range === 0) return currentValue >= targetValue ? 100 : 0
      return roundProgress(clampProgress(((currentValue - startValue) / range) * 100))
    }
  }
}

/**
 * The value a key result must reach for a given progress percentage.
 * Used by the check-in dialog to preview "what would 100% look like".
 */
export function valueForProgress(input: Omit<MetricInput, 'currentValue'>, progress: number): number {
  const ratio = clampProgress(progress) / 100
  if (input.metricType === 'BINARY') return ratio >= 1 ? input.targetValue : input.startValue
  return input.startValue + (input.targetValue - input.startValue) * ratio
}

/** True when the key result has reached (or passed) its target. */
export function hasReachedTarget(input: MetricInput): boolean {
  return calculateKeyResultProgress(input) >= 100
}
