import type { TabPaneInputSources } from '@/components/sidebar/smart-attention'
import {
  buildFocusedGroupTabRecency,
  orderRecentWorkspaceTabs,
  type RecentWorkspaceTabRow
} from '@/lib/recent-workspace-tab-rows'
import { formatUiRelativeTime } from '@/i18n/relative-time-format'
import { resolveThreadHeaderTitle } from '../../../../../shared/thread-header-title'
import type { TerminalTab } from '../../../../../shared/terminal-tab-types'
import type { TabGroup } from '../../../../../shared/tab-types'
import { filterThreadsByActiveScope } from './simple-mode-thread-scope-filter'
import type { RecentThreadSummary } from './RecentThreadsSection'

export type SimpleModeThreadTab = Pick<
  TerminalTab,
  'id' | 'threadScope' | 'customTitle' | 'aiVaultTitle' | 'createdAt'
>

const EMPTY_PANE_SOURCES: TabPaneInputSources = {
  entriesByTabId: new Map(),
  ptyIdsByTabId: {},
  runtimePaneTitlesByTabId: {},
  terminalLayoutsByTabId: {}
}

/**
 * Spec 013, criteria 1-3: the sidebar's "Recent threads" for the active
 * workspace scope — only threads that scope owns (criterion 2's filter),
 * ordered by activity (reusing `orderRecentWorkspaceTabs`, the same
 * attention-based ranking Cmd+J's recent section uses — the delegated
 * decision is to reuse this projection rather than write a second one),
 * with the currently open thread flagged. Title resolution and its "New
 * thread" fallback mirror the thread header (criteria 5, 6).
 */
export function buildSimpleModeThreadRows(params: {
  tabs: readonly SimpleModeThreadTab[]
  worktreeId: string
  activeWorkspaceScopeSlug: string | null
  activeTabId: string | null
  newThreadFallbackTitle: string
  now?: number
  worktreeLastActivityAt?: number
  paneSources?: TabPaneInputSources
  lastVisitedAtByWorktreeId?: Record<string, number>
  activeGroupIdByWorktree?: Record<string, string | undefined>
  groupsByWorktree?: Record<string, readonly TabGroup[] | undefined>
}): RecentThreadSummary[] {
  const now = params.now ?? Date.now()
  const paneSources = params.paneSources ?? EMPTY_PANE_SOURCES
  const scoped = filterThreadsByActiveScope(params.tabs, params.activeWorkspaceScopeSlug)
  // Deterministic base order before ranking: newest first, so equally-ranked
  // threads (e.g. two never-visited, no-attention threads) still read newest
  // to oldest rather than in arbitrary store order.
  const byRecency = [...scoped].sort((a, b) => b.createdAt - a.createdAt)
  const rows: RecentWorkspaceTabRow[] = byRecency.map((tab) => ({
    id: tab.id,
    worktreeId: params.worktreeId,
    unifiedTabId: null,
    // `title` is unused downstream (each row's display title is resolved via
    // `resolveThreadHeaderTitle` below) — this is only shaped to satisfy the
    // reused `RecentWorkspaceTabRow` row type.
    terminalTab: { id: tab.id, title: '' },
    worktreeLastActivityAt: params.worktreeLastActivityAt ?? now
  }))
  const order = orderRecentWorkspaceTabs({
    rows,
    paneSources,
    now,
    lastVisitedAtByWorktreeId: params.lastVisitedAtByWorktreeId ?? {},
    focusedGroupTabRecency: buildFocusedGroupTabRecency(
      params.activeGroupIdByWorktree ?? {},
      params.groupsByWorktree ?? {}
    )
  })
  const tabById = new Map(byRecency.map((tab) => [tab.id, tab]))
  return order.flatMap((id) => {
    const tab = tabById.get(id)
    if (!tab) {
      return []
    }
    return [
      {
        id: tab.id,
        title: resolveThreadHeaderTitle(tab, params.newThreadFallbackTitle),
        timestampLabel: formatUiRelativeTime(tab.createdAt - now),
        isActive: tab.id === params.activeTabId
      }
    ]
  })
}
