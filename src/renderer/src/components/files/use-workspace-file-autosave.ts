import { useCallback, useEffect, useRef, useState } from 'react'

/** How long the editor waits after the last keystroke before writing to disk.
 *  Long enough that a sentence is one write instead of forty; short enough
 *  that nobody leaves the screen ahead of the save — and leaving flushes what
 *  is pending anyway (spec 024). */
export const WORKSPACE_FILE_AUTOSAVE_DELAY_MS = 800

export type WorkspaceFileSaveState =
  /** Open and untouched: the screen states that it saves by itself. */
  | { status: 'idle' }
  /** Typed, not written yet. */
  | { status: 'pending' }
  | { status: 'saving' }
  | { status: 'saved' }
  /** Saved over a file that had changed somewhere else. */
  | { status: 'saved-over-outside-change' }
  | { status: 'error' }

export type WorkspaceFileAutosave = {
  state: WorkspaceFileSaveState
  /** Called on every edit; the write itself is debounced. */
  onContentChange: (content: string) => void
}

/** Saves what the person writes without a save button (spec 024, criterion 3):
 *  a write per pause in the typing, plus a flush whenever the file being
 *  edited changes or the screen goes away, so nothing typed is ever lost.
 *
 *  On a file that changed somewhere else since it was opened, what the person
 *  wrote is what gets saved and the state says so — see `decisions.md`,
 *  2026-09-04. */
export function useWorkspaceFileAutosave(
  rootPath: string | null,
  filePath: string | null,
  loadedModifiedAtMs: number | null
): WorkspaceFileAutosave {
  const [state, setState] = useState<WorkspaceFileSaveState>({ status: 'idle' })
  const pendingContentRef = useRef<string | null>(null)
  const modifiedAtMsRef = useRef<number | null>(loadedModifiedAtMs)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const targetRef = useRef<{ rootPath: string | null; filePath: string | null }>({
    rootPath,
    filePath
  })

  const flush = useCallback((): void => {
    const content = pendingContentRef.current
    const { rootPath: targetRoot, filePath: targetFile } = targetRef.current
    if (content === null || !targetRoot || !targetFile) {
      return
    }
    pendingContentRef.current = null
    setState({ status: 'saving' })
    window.api.workspaceScope
      .writeFile({
        rootPath: targetRoot,
        filePath: targetFile,
        content,
        expectedModifiedAtMs: modifiedAtMsRef.current
      })
      .then((result) => {
        modifiedAtMsRef.current = result.modifiedAtMs
        setState(
          result.outcome === 'changed-elsewhere'
            ? { status: 'saved-over-outside-change' }
            : { status: 'saved' }
        )
      })
      .catch(() => {
        setState({ status: 'error' })
      })
  }, [])

  // Why: the flush that runs when the open file changes has to write to the
  // file that was open, not to the one just selected.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      flush()
      targetRef.current = { rootPath: null, filePath: null }
    }
  }, [rootPath, filePath, flush])

  useEffect(() => {
    targetRef.current = { rootPath, filePath }
    modifiedAtMsRef.current = loadedModifiedAtMs
    pendingContentRef.current = null
    setState({ status: 'idle' })
  }, [rootPath, filePath, loadedModifiedAtMs])

  const onContentChange = useCallback(
    (content: string): void => {
      pendingContentRef.current = content
      setState({ status: 'pending' })
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        flush()
      }, WORKSPACE_FILE_AUTOSAVE_DELAY_MS)
    },
    [flush]
  )

  return { state, onContentChange }
}
