/**
 * Objective roll-up.
 *
 * An objective's progress is the weighted average of its key results, and —
 * when `rollupMode` is KEY_RESULTS_AND_CHILDREN — of its aligned child
 * objectives too. Child objectives are resolved recursively with cycle
 * protection, since `parentId` is user-editable and could in principle loop.
 */

import { clampProgress, roundProgress } from './progress'

export type RollupMode = 'KEY_RESULTS_ONLY' | 'KEY_RESULTS_AND_CHILDREN'

export interface WeightedItem {
  progress: number
  weight?: number
}

/** Weighted average of already-computed progress values. */
export function weightedAverage(items: WeightedItem[]): number {
  const usable = items.filter((item) => Number.isFinite(item.progress))
  if (usable.length === 0) return 0

  let weightedSum = 0
  let totalWeight = 0

  for (const item of usable) {
    const weight = Number.isFinite(item.weight) && (item.weight ?? 0) > 0 ? (item.weight as number) : 1
    weightedSum += clampProgress(item.progress) * weight
    totalWeight += weight
  }

  if (totalWeight === 0) return 0
  return roundProgress(clampProgress(weightedSum / totalWeight))
}

export interface RollupNode {
  id: string
  rollupMode: RollupMode
  keyResults: WeightedItem[]
  childIds: string[]
  /** Relative weight of this objective inside its parent's roll-up. */
  weight?: number
}

/**
 * Compute progress for every node in a tree of objectives.
 *
 * Returns a map of objectiveId → progress so callers can persist the whole
 * branch in one transaction. Nodes already being visited are treated as 0 to
 * break cycles rather than blowing the stack.
 */
export function rollupObjectiveTree(nodes: RollupNode[]): Map<string, number> {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const resolved = new Map<string, number>()
  const visiting = new Set<string>()

  function resolve(id: string): number {
    const cached = resolved.get(id)
    if (cached !== undefined) return cached
    if (visiting.has(id)) return 0

    const node = byId.get(id)
    if (!node) return 0

    visiting.add(id)

    const items: WeightedItem[] = [...node.keyResults]

    if (node.rollupMode === 'KEY_RESULTS_AND_CHILDREN') {
      for (const childId of node.childIds) {
        const child = byId.get(childId)
        if (!child) continue
        items.push({ progress: resolve(childId), weight: child.weight ?? 1 })
      }
    }

    visiting.delete(id)

    const progress = weightedAverage(items)
    resolved.set(id, progress)
    return progress
  }

  for (const node of nodes) resolve(node.id)
  return resolved
}

/** Progress of a single objective from its key results only. */
export function rollupFromKeyResults(keyResults: WeightedItem[]): number {
  return weightedAverage(keyResults)
}
