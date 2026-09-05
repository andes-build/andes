import { readFileSync, statSync } from 'node:fs'
import { isInsideRoot, WorkspaceFileOutsideRootError } from './workspace-file-scope'

export { WorkspaceFileOutsideRootError }

export type WorkspaceFileReadValue = {
  content: string
  /** Last-modified time of the file when it was read, in milliseconds. The
   *  editor sends it back on save so the main process can tell whether the
   *  file changed somewhere else in between (spec 024, criterion 7). */
  modifiedAtMs: number
}

/** Reads a file's text content for the Files screen (spec 010, criterion 9).
 *  Refuses any path outside `rootPath` — the active scope's directory — so a
 *  crafted relative path from the renderer can't read outside it. */
export function readWorkspaceFile(rootPath: string, filePath: string): WorkspaceFileReadValue {
  if (!isInsideRoot(rootPath, filePath)) {
    throw new WorkspaceFileOutsideRootError(filePath, 'read')
  }
  return {
    content: readFileSync(filePath, 'utf8'),
    modifiedAtMs: statSync(filePath).mtimeMs
  }
}
