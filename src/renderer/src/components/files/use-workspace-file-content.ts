import { useEffect, useState } from 'react'

export type WorkspaceFileContentState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; content: string }
  | { status: 'error'; message: string }

/** Loads a file's text content for the Files screen viewer, reloading
 *  whenever `filePath` changes; `null` renders the "select a file" state. */
export function useWorkspaceFileContent(
  rootPath: string | null,
  filePath: string | null
): WorkspaceFileContentState {
  const [state, setState] = useState<WorkspaceFileContentState>({ status: 'idle' })

  useEffect(() => {
    if (!rootPath || !filePath) {
      setState({ status: 'idle' })
      return
    }
    let cancelled = false
    setState({ status: 'loading' })
    window.api.workspaceScope
      .readFile({ rootPath, filePath })
      .then((result) => {
        if (!cancelled) {
          setState({ status: 'loaded', content: result.content })
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
  }, [rootPath, filePath])

  return state
}
