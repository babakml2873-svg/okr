import { describe, expect, it } from 'vitest'

import { rollupFromKeyResults, rollupObjectiveTree, weightedAverage, type RollupNode } from './rollup'

describe('weightedAverage', () => {
  it('averages evenly when no weights are given', () => {
    expect(weightedAverage([{ progress: 0 }, { progress: 50 }, { progress: 100 }])).toBe(50)
  })

  it('respects weights', () => {
    // A triple-weighted 100 against a single-weighted 0 → 75.
    expect(weightedAverage([{ progress: 100, weight: 3 }, { progress: 0, weight: 1 }])).toBe(75)
  })

  it('treats zero and negative weights as 1', () => {
    expect(weightedAverage([{ progress: 100, weight: 0 }, { progress: 0, weight: -5 }])).toBe(50)
  })

  it('returns 0 for an objective with no key results', () => {
    expect(weightedAverage([])).toBe(0)
  })

  it('clamps member values before averaging', () => {
    expect(weightedAverage([{ progress: 400 }, { progress: -100 }])).toBe(50)
  })

  it('rounds to two decimals', () => {
    expect(weightedAverage([{ progress: 100 }, { progress: 0 }, { progress: 0 }])).toBe(33.33)
  })
})

describe('rollupFromKeyResults', () => {
  it('is the weighted average of the key results', () => {
    expect(rollupFromKeyResults([{ progress: 80, weight: 2 }, { progress: 20, weight: 2 }])).toBe(50)
  })
})

describe('rollupObjectiveTree', () => {
  it('ignores children when the mode is key-results-only', () => {
    const nodes: RollupNode[] = [
      { id: 'parent', rollupMode: 'KEY_RESULTS_ONLY', keyResults: [{ progress: 40 }], childIds: ['child'] },
      { id: 'child', rollupMode: 'KEY_RESULTS_ONLY', keyResults: [{ progress: 100 }], childIds: [] },
    ]
    const result = rollupObjectiveTree(nodes)
    expect(result.get('parent')).toBe(40)
    expect(result.get('child')).toBe(100)
  })

  it('folds children in when the mode includes them', () => {
    const nodes: RollupNode[] = [
      {
        id: 'parent',
        rollupMode: 'KEY_RESULTS_AND_CHILDREN',
        keyResults: [{ progress: 40 }],
        childIds: ['child'],
      },
      { id: 'child', rollupMode: 'KEY_RESULTS_ONLY', keyResults: [{ progress: 100 }], childIds: [] },
    ]
    expect(rollupObjectiveTree(nodes).get('parent')).toBe(70)
  })

  it('rolls up through several levels', () => {
    const nodes: RollupNode[] = [
      { id: 'company', rollupMode: 'KEY_RESULTS_AND_CHILDREN', keyResults: [], childIds: ['dept'] },
      { id: 'dept', rollupMode: 'KEY_RESULTS_AND_CHILDREN', keyResults: [], childIds: ['team'] },
      { id: 'team', rollupMode: 'KEY_RESULTS_ONLY', keyResults: [{ progress: 60 }], childIds: [] },
    ]
    const result = rollupObjectiveTree(nodes)
    expect(result.get('company')).toBe(60)
    expect(result.get('dept')).toBe(60)
  })

  it('honours child weights', () => {
    const nodes: RollupNode[] = [
      {
        id: 'parent',
        rollupMode: 'KEY_RESULTS_AND_CHILDREN',
        keyResults: [],
        childIds: ['a', 'b'],
      },
      { id: 'a', rollupMode: 'KEY_RESULTS_ONLY', keyResults: [{ progress: 100 }], childIds: [], weight: 3 },
      { id: 'b', rollupMode: 'KEY_RESULTS_ONLY', keyResults: [{ progress: 0 }], childIds: [], weight: 1 },
    ]
    expect(rollupObjectiveTree(nodes).get('parent')).toBe(75)
  })

  it('survives a cycle in the alignment graph', () => {
    const nodes: RollupNode[] = [
      { id: 'a', rollupMode: 'KEY_RESULTS_AND_CHILDREN', keyResults: [{ progress: 50 }], childIds: ['b'] },
      { id: 'b', rollupMode: 'KEY_RESULTS_AND_CHILDREN', keyResults: [{ progress: 50 }], childIds: ['a'] },
    ]
    const result = rollupObjectiveTree(nodes)
    expect(result.get('a')).toBeGreaterThanOrEqual(0)
    expect(result.get('b')).toBeGreaterThanOrEqual(0)
  })

  it('ignores child ids that are not in the given set', () => {
    const nodes: RollupNode[] = [
      {
        id: 'parent',
        rollupMode: 'KEY_RESULTS_AND_CHILDREN',
        keyResults: [{ progress: 80 }],
        childIds: ['missing'],
      },
    ]
    expect(rollupObjectiveTree(nodes).get('parent')).toBe(80)
  })
})
