/**
 * Health, colour bands and confidence semantics.
 *
 * Two distinct ideas that are easy to conflate:
 *
 *   progressBand()   — the flat 0-30 / 30-70 / 70-100 red-yellow-green scale
 *                      the product spec asks for. Purely about the number.
 *   calculateHealth() — time-aware risk. Compares actual progress against the
 *                      progress you *should* have at this point in the quarter
 *                      and factors in the owner's confidence.
 */

import { clampProgress } from './progress'

export type ProgressBand = 'RED' | 'YELLOW' | 'GREEN'
export type Health = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK'

export const PROGRESS_BAND_THRESHOLDS = { red: 30, yellow: 70 } as const

/** Flat colour band used for progress bars and badges. */
export function progressBand(progress: number): ProgressBand {
  const value = clampProgress(progress)
  if (value < PROGRESS_BAND_THRESHOLDS.red) return 'RED'
  if (value < PROGRESS_BAND_THRESHOLDS.yellow) return 'YELLOW'
  return 'GREEN'
}

/** Fraction of the period that has elapsed, 0–1. */
export function elapsedRatio(start: Date, end: Date, now: Date = new Date()): number {
  const total = end.getTime() - start.getTime()
  if (total <= 0) return 1
  const elapsed = now.getTime() - start.getTime()
  if (elapsed <= 0) return 0
  if (elapsed >= total) return 1
  return elapsed / total
}

/** The progress a linear pace would have reached by now, as a percentage. */
export function expectedProgress(start: Date, end: Date, now: Date = new Date()): number {
  return elapsedRatio(start, end, now) * 100
}

export interface HealthInput {
  progress: number
  /** Owner-declared confidence, 1–10. */
  confidence: number
  periodStart: Date
  periodEnd: Date
  now?: Date
}

/**
 * Risk signal, driven by how far behind the linear pace the item is.
 *
 *   gap = progress - expectedProgress
 *     gap >= -10  → ON_TRACK
 *     gap >= -25  → AT_RISK
 *     otherwise   → OFF_TRACK
 *
 * Low confidence (<= 4) downgrades ON_TRACK to AT_RISK: the owner is telling
 * us something the raw numbers don't show yet. Anything already at 100% is
 * always ON_TRACK.
 */
export function calculateHealth({
  progress,
  confidence,
  periodStart,
  periodEnd,
  now = new Date(),
}: HealthInput): Health {
  const actual = clampProgress(progress)
  if (actual >= 100) return 'ON_TRACK'

  const gap = actual - expectedProgress(periodStart, periodEnd, now)

  let health: Health
  if (gap >= -10) health = 'ON_TRACK'
  else if (gap >= -25) health = 'AT_RISK'
  else health = 'OFF_TRACK'

  if (health === 'ON_TRACK' && confidence <= 4) health = 'AT_RISK'
  if (health === 'AT_RISK' && confidence <= 2) health = 'OFF_TRACK'

  return health
}

/** Confidence buckets used for the confidence meter colours. */
export function confidenceBand(confidence: number): ProgressBand {
  if (confidence <= 4) return 'RED'
  if (confidence <= 7) return 'YELLOW'
  return 'GREEN'
}
