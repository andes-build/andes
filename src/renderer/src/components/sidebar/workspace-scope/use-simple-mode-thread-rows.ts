import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'
import { buildExplicitEntriesByTabId } from '@/components/sidebar/smart-attention'
import { buildSimpleModeThreadRows } from './simple-mode-thread-rows'
import type { RecentThreadSummary } from './RecentThreadsSection'

const EMPTY_TABS: never[] = []

/**
 * Spec 013, criteria 1-3: "Recent threads" for the sidebar — the active
 * worktree's tabs in the active workspace scope, ranked by activity, with
 * the open one flagged. See `buildSimpleModeThreadRows` for the projection
 * itself; this hook only wires it to the store.
 */
export function useSimpleModeThreadRows(): RecentThreadSummary[] {
  const worktreeId = useAppStore((state) => state.activeWorktreeId)
  const activeTabId = useAppStore((state) => state.activeTabId)
  const activeWorkspaceScopeSlug = useAppStore((state) => state.activeWorkspaceScopeSlug)
  const tabs = useAppStore((state) =>
    worktreeId ? (state.tabsByWorktree[worktreeId] ?? EMPTY_TABS) : EMPTY_TABS
  )
  const {
    agentStatusByPaneKey,
    migrationUnsupportedByPtyId,
    ptyIdsByTabId,
    runtimePaneTitlesByTabId,
    terminalLayoutsByTabId
  } = useAppStore(
    useShallow((state) => ({
      agentStatusByPaneKey: state.agentStatusByPaneKey,
      migrationUnsupportedByPtyId: state.migrationUnsupportedByPtyId,
      ptyIdsByTabId: state.ptyIdsByTabId,
      runtimePaneTitlesByTabId: state.runtimePaneTitlesByTabId,
      terminalLayoutsByTabId: state.terminalLayoutsByTabId
    }))
  )
  const lastVisitedAtByWorktreeId = useAppStore((state) => state.lastVisitedAtByWorktreeId)
  const activeGroupIdByWorktree = useAppStore((state) => state.activeGroupIdByWorktree)
  const groupsByWorktree = useAppStore((state) => state.groupsByWorktree)

  const paneSources = useMemo(
    () => ({
      entriesByTabId: buildExplicitEntriesByTabId(
        agentStatusByPaneKey,
        migrationUnsupportedByPtyId
      ),
      ptyIdsByTabId,
      runtimePaneTitlesByTabId,
      terminalLayoutsByTabId
    }),
    [
      agentStatusByPaneKey,
      migrationUnsupportedByPtyId,
      ptyIdsByTabId,
      runtimePaneTitlesByTabId,
      terminalLayoutsByTabId
    ]
  )

  return useMemo(() => {
    if (!worktreeId) {
      return []
    }
    return buildSimpleModeThreadRows({
      tabs,
      worktreeId,
      activeWorkspaceScopeSlug,
      activeTabId,
      newThreadFallbackTitle: translate(
        'components.native-chat.threadHeader.newThread',
        'New thread'
      ),
      paneSources,
      lastVisitedAtByWorktreeId,
      activeGroupIdByWorktree,
      groupsByWorktree
    })
  }, [
    activeGroupIdByWorktree,
    activeTabId,
    activeWorkspaceScopeSlug,
    groupsByWorktree,
    lastVisitedAtByWorktreeId,
    paneSources,
    tabs,
    worktreeId
  ])
}
