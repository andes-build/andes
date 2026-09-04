/**
 * Spec 021. The thread opened and nothing was painted: the panel stayed
 * blank and the tab strip showed no tab, while the store already held the
 * tab, its group and its thread scope.
 *
 * The cause is a disagreement between two records that are written by
 * different actions: `layoutByWorktree` kept a leaf naming a group that
 * `groupsByWorktree` no longer contains. The layout leaf renders that dead
 * group's (empty) tab strip, and the terminal pane overlay — anchored by CSS
 * anchor positioning to the live group's body, which is never rendered —
 * collapses to 0x0.
 *
 * `getEffectiveLayoutForWorktree` is the single place every render path asks
 * for a worktree's layout, so it is where the stale leaf is dropped.
 */
import { describe, expect, it } from 'vitest'
import { getEffectiveLayoutForWorktree } from './split-group-mount'
import type { TabGroup, TabGroupLayoutNode } from '../../../../shared/tab-types'

function makeGroup(id: string, worktreeId: string): TabGroup {
  return { id, worktreeId, activeTabId: null, tabOrder: [] }
}

describe('spec 021 — a layout leaf naming a group that is gone', () => {
  it('spec021#1 resolves to the live group instead of the dead leaf', () => {
    const staleLayout: TabGroupLayoutNode = { type: 'leaf', groupId: 'group-that-is-gone' }
    const result = getEffectiveLayoutForWorktree(
      'wt-1',
      { 'wt-1': staleLayout },
      { 'wt-1': [makeGroup('group-that-exists', 'wt-1')] },
      { 'wt-1': 'group-that-exists' }
    )
    expect(result).toEqual({ type: 'leaf', groupId: 'group-that-exists' })
  })

  it('spec021#2 uses the first live group when no active group is recorded', () => {
    const staleLayout: TabGroupLayoutNode = { type: 'leaf', groupId: 'group-that-is-gone' }
    const result = getEffectiveLayoutForWorktree(
      'wt-1',
      { 'wt-1': staleLayout },
      { 'wt-1': [makeGroup('group-that-exists', 'wt-1')] },
      {}
    )
    expect(result).toEqual({ type: 'leaf', groupId: 'group-that-exists' })
  })

  it('spec021#3 keeps the live half of a split and drops the dead one', () => {
    const staleSplit: TabGroupLayoutNode = {
      type: 'split',
      direction: 'horizontal',
      first: { type: 'leaf', groupId: 'group-that-is-gone' },
      second: { type: 'leaf', groupId: 'group-that-exists' }
    }
    const result = getEffectiveLayoutForWorktree(
      'wt-1',
      { 'wt-1': staleSplit },
      { 'wt-1': [makeGroup('group-that-exists', 'wt-1')] },
      { 'wt-1': 'group-that-exists' }
    )
    expect(result).toEqual({ type: 'leaf', groupId: 'group-that-exists' })
  })

  it('spec021#4 leaves a layout untouched while the worktree still has no group', () => {
    // Why: a worktree mid-hydration has a layout and no groups yet. Returning
    // undefined there would unmount the whole split container.
    const layout: TabGroupLayoutNode = { type: 'leaf', groupId: 'g1' }
    const result = getEffectiveLayoutForWorktree('wt-1', { 'wt-1': layout }, {}, {})
    expect(result).toBe(layout)
  })

  it('spec021#5 leaves a healthy layout untouched', () => {
    const layout: TabGroupLayoutNode = { type: 'leaf', groupId: 'g1' }
    const result = getEffectiveLayoutForWorktree(
      'wt-1',
      { 'wt-1': layout },
      { 'wt-1': [makeGroup('g1', 'wt-1')] },
      { 'wt-1': 'g1' }
    )
    expect(result).toBe(layout)
  })
})
