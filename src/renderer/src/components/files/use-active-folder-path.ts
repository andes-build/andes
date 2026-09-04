import { useActiveWorktreeId, useWorktreeById } from '@/store/selectors'

/** The absolute path of the folder Andes has open — the active folder
 *  workspace (Orca's own "workspace" concept: a mounted project), which for
 *  Andes is the folder the person picked or created in onboarding. `null`
 *  before any folder has been activated. */
export function useActiveFolderPath(): string | null {
  const activeWorktreeId = useActiveWorktreeId()
  const worktree = useWorktreeById(activeWorktreeId)
  return worktree?.path ?? null
}
