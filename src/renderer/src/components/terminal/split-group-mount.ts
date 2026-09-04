import type { TabGroup, TabGroupLayoutNode } from '../../../../shared/tab-types'
import { pruneTabGroupLayoutForGroups } from '../../store/slices/tabs-hydration'

/**
 * Derive the effective layout for a worktree: either its explicit layout
 * or a synthetic leaf wrapping its first/active group.
 *
 * Spec 021. The explicit layout is pruned against the groups that actually
 * exist before it is returned. A leaf naming a group that is gone renders an
 * empty tab strip, and the terminal pane overlay — anchored by CSS anchor
 * positioning to that group's body — collapses to 0x0: the thread is in the
 * document and nothing is painted. `layoutByWorktree` and `groupsByWorktree`
 * are written by different actions (`ensureWorktreeRootGroup`,
 * `hydrateTabsSession`, `createTab`), so they can and do disagree; the render
 * path never assumes they agree.
 */
export function getEffectiveLayoutForWorktree(
  worktreeId: string,
  layoutByWorktree: Record<string, TabGroupLayoutNode | undefined>,
  groupsByWorktree: Record<string, TabGroup[]>,
  activeGroupIdByWorktree: Record<string, string | undefined>
): TabGroupLayoutNode | undefined {
  const layout = layoutByWorktree[worktreeId]
  const groups = groupsByWorktree[worktreeId] ?? []
  const liveGroupIds = new Set(groups.map((group) => group.id))
  const liveLayout = layout ? pruneTabGroupLayoutForGroups(layout, liveGroupIds) : null
  if (liveLayout) {
    return liveLayout
  }
  const fallbackGroupId = activeGroupIdByWorktree[worktreeId] ?? groups[0]?.id ?? null
  if (fallbackGroupId && liveGroupIds.has(fallbackGroupId)) {
    return { type: 'leaf', groupId: fallbackGroupId } as const
  }
  // Why: no live group to render yet. Return what this function returned
  // before the pruning above existed, so a worktree still hydrating keeps the
  // split container mounted (see `anyMountedWorktreeHasLayout`).
  if (layout) {
    return layout
  }
  if (!fallbackGroupId) {
    return undefined
  }
  return { type: 'leaf', groupId: fallbackGroupId } as const
}

/**
 * Returns true if any mounted worktree has a split-group layout.
 *
 * Why: the split-group container hosts ALL mounted worktrees' pane trees.
 * Gating it on only the *active* worktree's layout causes the entire tree
 * to unmount when switching to a newly-activated worktree that has no
 * groups yet — destroying PaneManagers, xterm buffers, and PTY connections.
 */
export function anyMountedWorktreeHasLayout(
  allWorktreeIds: string[],
  mountedWorktreeIds: ReadonlySet<string>,
  layoutByWorktree: Record<string, TabGroupLayoutNode | undefined>,
  groupsByWorktree: Record<string, TabGroup[]>,
  activeGroupIdByWorktree: Record<string, string | undefined>
): boolean {
  return allWorktreeIds.some(
    (id) =>
      mountedWorktreeIds.has(id) &&
      getEffectiveLayoutForWorktree(id, layoutByWorktree, groupsByWorktree, activeGroupIdByWorktree)
  )
}
