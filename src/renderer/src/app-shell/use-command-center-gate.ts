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
 * (worktree or plain folder), and no *thread* opened in it yet. A plain
 * terminal tab does not count as a thread — opening a folder already seeds
 * one by itself (`createFolderWorkspace`'s own default-tab behavior, outside
 * this spec) — only a tab actually launched with an agent
 * (`TerminalTab.launchAgent`, set by `launchAgentInNewTab`) does. There is no
 * workspace selector yet (spec 010): the active workspace *is* the scope,
 * root or worktree alike.
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

  if (interfaceMode !== 'simple' || !activeWorktreeId || hasAgentThread) {
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
