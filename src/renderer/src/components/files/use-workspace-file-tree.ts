import { useEffect, useState } from 'react'
import type { WorkspaceFileTreeNode } from '../../../../shared/workspace-scope-types'

export type WorkspaceFileTreeState =
  | { status: 'loading' }
  | { status: 'loaded'; root: WorkspaceFileTreeNode[] }
  | { status: 'error'; message: string }

/** Loads the file tree rooted at `rootPath` (a workspace's directory, or the
 *  brain root for "My work") — reloads whenever the path changes. */
export function useWorkspaceFileTree(rootPath: string | null): WorkspaceFileTreeState {
  const [state, setState] = useState<WorkspaceFileTreeState>({ status: 'loading' })

  useEffect(() => {
    if (!rootPath) {
      setState({ status: 'loaded', root: [] })
      return
    }
    let cancelled = false
    setState({ status: 'loading' })
    window.api.workspaceScope
      .fileTree({ rootPath })
      .then((result) => {
        if (!cancelled) {
          setState({ status: 'loaded', root: result.root })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error)
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [rootPath])

  return state
}
