import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

export class WorkspaceFileOutsideRootError extends Error {
  constructor(filePath: string) {
    super(`Refused to read a path outside the workspace scope: ${filePath}`)
    this.name = 'WorkspaceFileOutsideRootError'
  }
}

/** True when `filePath` resolves inside `rootPath` (or is `rootPath` itself). */
function isInsideRoot(rootPath: string, filePath: string): boolean {
  const relativePath = relative(resolve(rootPath), resolve(filePath))
  return relativePath === '' || (!relativePath.startsWith('..') && !relativePath.startsWith('/'))
}

/** Reads a file's text content for the Files screen (spec 010, criterion 9).
 *  Refuses any path outside `rootPath` — the active scope's directory — so a
 *  crafted relative path from the renderer can't read outside it. */
export function readWorkspaceFile(rootPath: string, filePath: string): string {
  if (!isInsideRoot(rootPath, filePath)) {
    throw new WorkspaceFileOutsideRootError(filePath)
  }
  return readFileSync(filePath, 'utf8')
}
