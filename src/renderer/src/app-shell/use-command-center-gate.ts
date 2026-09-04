import { useAppStore } from '@/store'
import { useInterfaceMode } from '@/hooks/useInterfaceMode'
import { parseWorkspaceKey } from '../../../shared/workspace-scope'

export type CommandCenterGate = {
  /** True when the Command Center should replace the plain terminal view. */
  active: boolean
  brainPath: string | null
  worktreeId: string | null
}

/**
 * Decides whether the Command Center takes over the "terminal" view for the
 * active workspace (spec 009, criterion 1): simple mode, an active workspace
 * (worktree or plain folder), and either no *thread* opened in it yet or the
 * operator asking for it from the navigation.
 *
 * A plain terminal tab does not count as a thread — opening a folder already
 * seeds one by itself (`createFolderWorkspace`'s own default-tab behavior,
 * outside this spec) — only a tab actually launched with an agent
 * (`TerminalTab.launchAgent`, set by `launchAgentInNewTab`) does.
 *
 * `commandCenterRequested` is the navigation item spec 010 shipped pointing
 * at this screen: without it the item would be dead once a thread exists,
 * because the thread owns the terminal view.
 *
 * Which *scope* the screen scans is not decided here: the Command Center
 * reads spec 010's selector directly.
 */
export function useCommandCenterGate(activeWorktreeId: string | null): CommandCenterGate {
  const interfaceMode = useInterfaceMode()
  const folderWorkspaces = useAppStore((s) => s.folderWorkspaces)
  const worktree = useAppStore((s) =>
    activeWorktreeId ? s.allWorktrees().find((entry) => entry.id === activeWorktreeId) : undefined
  )
  const hasAgentThread = useAppStore((s) =>
    activeWorktreeId
      ? (s.tabsByWorktree[activeWorktreeId] ?? []).some((tab) => Boolean(tab.launchAgent))
      : false
  )

  const commandCenterRequested = useAppStore((s) => s.commandCenterRequested)

  if (interfaceMode !== 'simple' || !activeWorktreeId) {
    return { active: false, brainPath: null, worktreeId: null }
  }
  if (hasAgentThread && !commandCenterRequested) {
    return { active: false, brainPath: null, worktreeId: null }
  }

  const scope = parseWorkspaceKey(activeWorktreeId)
  const brainPath =
    scope?.type === 'folder'
      ? (folderWorkspaces.find((entry) => entry.id === scope.folderWorkspaceId)?.folderPath ?? null)
      : (worktree?.path ?? null)

  if (!brainPath) {
    return { active: false, brainPath: null, worktreeId: null }
  }
  return { active: true, brainPath, worktreeId: activeWorktreeId }
}
