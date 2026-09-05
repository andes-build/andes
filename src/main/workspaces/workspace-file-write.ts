import { statSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import { isEditableMarkdownFileName } from '../../shared/workspace-markdown-file'
import { isInsideRoot, WorkspaceFileOutsideRootError } from './workspace-file-scope'

export { WorkspaceFileOutsideRootError }

export class WorkspaceFileNotEditableError extends Error {
  constructor(filePath: string) {
    super(`Refused to write a file that is not an editable document: ${filePath}`)
    this.name = 'WorkspaceFileNotEditableError'
  }
}

export class WorkspaceFileMissingError extends Error {
  constructor(filePath: string) {
    super(`Refused to write a file that does not exist: ${filePath}`)
    this.name = 'WorkspaceFileMissingError'
  }
}

export type WorkspaceFileWriteValue = {
  /** `saved`: the file on disk was the one the editor had open.
   *  `changed-elsewhere`: it had been modified since the editor read it. What
   *  the person wrote is saved either way — the screen says which happened
   *  (spec 024, criterion 7). */
  outcome: 'saved' | 'changed-elsewhere'
  modifiedAtMs: number
}

/** Writes the text of a document the Files screen has open (spec 024).
 *
 *  Three refusals, in this order: a path outside the active scope, a file
 *  that is not an editable document, and a file that does not exist. Creating
 *  files is out of this spec's scope, so a missing path is a refusal and never
 *  a creation. */
export function writeWorkspaceFile(
  rootPath: string,
  filePath: string,
  content: string,
  expectedModifiedAtMs: number | null
): WorkspaceFileWriteValue {
  if (!isInsideRoot(rootPath, filePath)) {
    throw new WorkspaceFileOutsideRootError(filePath, 'write')
  }
  if (!isEditableMarkdownFileName(basename(filePath))) {
    throw new WorkspaceFileNotEditableError(filePath)
  }
  let currentModifiedAtMs: number
  try {
    currentModifiedAtMs = statSync(filePath).mtimeMs
  } catch {
    throw new WorkspaceFileMissingError(filePath)
  }
  const changedElsewhere =
    expectedModifiedAtMs !== null && Math.abs(currentModifiedAtMs - expectedModifiedAtMs) > 1
  writeFileSync(filePath, content, 'utf8')
  return {
    outcome: changedElsewhere ? 'changed-elsewhere' : 'saved',
    modifiedAtMs: statSync(filePath).mtimeMs
  }
}
