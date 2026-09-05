import { relative, resolve } from 'node:path'

export class WorkspaceFileOutsideRootError extends Error {
  constructor(filePath: string, verb: 'read' | 'write') {
    super(`Refused to ${verb} a path outside the workspace scope: ${filePath}`)
    this.name = 'WorkspaceFileOutsideRootError'
  }
}

/** True when `filePath` resolves inside `rootPath` (or is `rootPath` itself). */
export function isInsideRoot(rootPath: string, filePath: string): boolean {
  const relativePath = relative(resolve(rootPath), resolve(filePath))
  return relativePath === '' || (!relativePath.startsWith('..') && !relativePath.startsWith('/'))
}
