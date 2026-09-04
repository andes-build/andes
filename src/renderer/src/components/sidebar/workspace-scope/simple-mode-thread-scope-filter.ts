import type { ThreadScope } from '../../../../../shared/workspace-scope-types'

/**
 * Spec 013, criterion 2: whether a thread belongs to the active workspace
 * scope. A tab with no captured `threadScope` (opened outside simple mode's
 * sidebar — see `terminal-tab-types.ts`) counts as root, the same as an
 * explicit `{ kind: 'root' }` scope.
 */
export function threadScopeMatchesActiveScope(
  threadScope: ThreadScope | undefined,
  activeWorkspaceScopeSlug: string | null
): boolean {
  if (activeWorkspaceScopeSlug === null) {
    return threadScope === undefined || threadScope.kind === 'root'
  }
  return threadScope?.kind === 'workspace' && threadScope.slug === activeWorkspaceScopeSlug
}

/** Only the tabs belonging to the active scope, from a single worktree's tabs. */
export function filterThreadsByActiveScope<T extends { threadScope?: ThreadScope }>(
  tabs: readonly T[],
  activeWorkspaceScopeSlug: string | null
): T[] {
  return tabs.filter((tab) =>
    threadScopeMatchesActiveScope(tab.threadScope, activeWorkspaceScopeSlug)
  )
}
