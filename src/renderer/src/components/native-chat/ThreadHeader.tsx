import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'
import { resolveThreadHeaderTitle } from '../../../../shared/thread-header-title'
import type { TerminalTab } from '../../../../shared/terminal-tab-types'
import type { ThreadScope } from '../../../../shared/workspace-scope-types'

type ThreadHeaderTab = Pick<TerminalTab, 'threadScope' | 'customTitle' | 'aiVaultTitle'>

/** Finds a tab by id across every worktree — the caller only has the tab id,
 *  not which worktree owns it. */
function findThreadHeaderTab(
  tabsByWorktree: Record<string, TerminalTab[]>,
  tabId: string
): ThreadHeaderTab | null {
  for (const tabs of Object.values(tabsByWorktree)) {
    const match = tabs.find((tab) => tab.id === tabId)
    if (match) {
      return match
    }
  }
  return null
}

export function threadScopeLabel(scope: ThreadScope): string {
  return scope.kind === 'root'
    ? translate('components.native-chat.threadScope.root', 'My work')
    : translate('components.native-chat.threadScope.workspace', 'Workspace · Focus: {{value0}}', {
        value0: scope.name
      })
}

/**
 * Spec 013, criterion 4: above the conversation, the thread's title and
 * (below it) its scope — "My work" at the root, "Workspace · Focus: <name>"
 * inside a workspace. Supersedes spec 019's `ThreadScopeBadge`, which drew
 * only the scope line; the scope logic itself (`threadScopeLabel`, reading
 * `tab.threadScope` — captured once at launch, never the sidebar selector's
 * live value) is unchanged.
 *
 * Renders nothing without a captured scope — the same gate spec 019 used —
 * so a developer-mode tab (no `threadScope`) shows nothing here, same as
 * before (criterion 9).
 */
export function ThreadHeader({ tabId }: { tabId: string | null }): React.JSX.Element | null {
  const tab = useAppStore((state) =>
    tabId ? findThreadHeaderTab(state.tabsByWorktree, tabId) : null
  )
  if (!tab?.threadScope) {
    return null
  }
  const title = resolveThreadHeaderTitle(
    tab,
    translate('components.native-chat.threadHeader.newThread', 'New thread')
  )
  return (
    <div
      data-testid="thread-header"
      className="flex shrink-0 flex-col gap-0.5 border-b border-border bg-muted/40 px-3 py-1.5"
    >
      <span
        data-testid="thread-header-title"
        className="truncate text-sm font-medium text-foreground"
      >
        {title}
      </span>
      <span data-testid="thread-scope-badge" className="text-xs text-muted-foreground">
        {threadScopeLabel(tab.threadScope)}
      </span>
    </div>
  )
}
