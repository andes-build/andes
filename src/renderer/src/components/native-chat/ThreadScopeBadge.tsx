import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'
import type { TerminalTab } from '../../../../shared/terminal-tab-types'
import type { ThreadScope } from '../../../../shared/workspace-scope-types'

/** Finds a tab by id across every worktree — the caller only has the tab id,
 *  not which worktree owns it. */
function findThreadScope(
  tabsByWorktree: Record<string, TerminalTab[]>,
  tabId: string
): ThreadScope | null {
  for (const tabs of Object.values(tabsByWorktree)) {
    const match = tabs.find((tab) => tab.id === tabId)
    if (match) {
      return match.threadScope ?? null
    }
  }
  return null
}

export function threadScopeLabel(scope: ThreadScope): string {
  return scope.kind === 'root'
    ? translate('components.native-chat.threadScope.root', 'My work')
    : translate('components.native-chat.threadScope.workspace', '{{value0}}', {
        value0: scope.name
      })
}

/**
 * Spec 019, criterion 3: shows the scope a thread was born with, so the
 * person can tell what they are working on without asking. Reads the tab's
 * `threadScope` — captured once at launch time (`open-new-thread.ts`) — never
 * the sidebar selector's live value, so switching the selector never changes
 * what an already-open thread shows.
 */
export function ThreadScopeBadge({ tabId }: { tabId: string | null }): React.JSX.Element | null {
  const threadScope = useAppStore((state) =>
    tabId ? findThreadScope(state.tabsByWorktree, tabId) : null
  )
  if (!threadScope) {
    return null
  }
  return (
    <div
      data-testid="thread-scope-badge"
      className="flex shrink-0 items-center gap-1.5 border-b border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground"
    >
      <span>{threadScopeLabel(threadScope)}</span>
    </div>
  )
}
