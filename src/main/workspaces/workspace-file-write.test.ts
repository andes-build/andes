import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readWorkspaceFile } from './workspace-file-read'
import {
  writeWorkspaceFile,
  WorkspaceFileMissingError,
  WorkspaceFileNotEditableError,
  WorkspaceFileOutsideRootError
} from './workspace-file-write'

describe('writeWorkspaceFile', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'andes-workspace-file-write-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('saves a document inside the scope (spec 024, criterion 1)', () => {
    const filePath = join(root, 'backlog.md')
    writeFileSync(filePath, '# Backlog\n')
    const result = writeWorkspaceFile(root, filePath, '# Backlog\n\nOne thing.\n', null)
    expect(result.outcome).toBe('saved')
    expect(readFileSync(filePath, 'utf8')).toBe('# Backlog\n\nOne thing.\n')
  })

  it('refuses a path outside the scope (criterion 5)', () => {
    const outside = mkdtempSync(join(tmpdir(), 'andes-workspace-file-write-outside-'))
    const outsidePath = join(outside, 'secret.md')
    writeFileSync(outsidePath, 'untouched')
    try {
      expect(() => writeWorkspaceFile(root, outsidePath, 'overwritten', null)).toThrow(
        WorkspaceFileOutsideRootError
      )
      expect(readFileSync(outsidePath, 'utf8')).toBe('untouched')
    } finally {
      rmSync(outside, { recursive: true, force: true })
    }
  })

  it('refuses a traversal path that only looks nested (criterion 5)', () => {
    mkdirSync(join(root, 'nested'))
    writeFileSync(join(root, 'backlog.md'), 'untouched')
    expect(() =>
      writeWorkspaceFile(join(root, 'nested'), join(root, 'backlog.md'), 'overwritten', null)
    ).toThrow(WorkspaceFileOutsideRootError)
    expect(readFileSync(join(root, 'backlog.md'), 'utf8')).toBe('untouched')
  })

  it('refuses a file that is not a document (criterion 6)', () => {
    const filePath = join(root, 'orca.yaml')
    writeFileSync(filePath, 'untouched')
    expect(() => writeWorkspaceFile(root, filePath, 'overwritten', null)).toThrow(
      WorkspaceFileNotEditableError
    )
    expect(readFileSync(filePath, 'utf8')).toBe('untouched')
  })

  it('refuses a file that does not exist: this spec never creates files', () => {
    expect(() => writeWorkspaceFile(root, join(root, 'new.md'), 'hello', null)).toThrow(
      WorkspaceFileMissingError
    )
  })

  it('keeps what the person wrote when the file changed elsewhere, and says so (criterion 7)', () => {
    const filePath = join(root, 'decisions.md')
    writeFileSync(filePath, 'as opened\n')
    const opened = readWorkspaceFile(root, filePath)

    // Something else rewrites the file while the editor has it open.
    writeFileSync(filePath, 'written by something else\n')
    const outsideTime = new Date((statSync(filePath).mtimeMs + 5_000) / 1000)
    utimesSync(filePath, outsideTime, outsideTime)

    const result = writeWorkspaceFile(
      root,
      filePath,
      'what the person wrote\n',
      opened.modifiedAtMs
    )
    expect(result.outcome).toBe('changed-elsewhere')
    expect(readFileSync(filePath, 'utf8')).toBe('what the person wrote\n')
  })

  it('reports a plain save when nothing else touched the file (criterion 7)', () => {
    const filePath = join(root, 'decisions.md')
    writeFileSync(filePath, 'as opened\n')
    const opened = readWorkspaceFile(root, filePath)
    const result = writeWorkspaceFile(root, filePath, 'edited\n', opened.modifiedAtMs)
    expect(result.outcome).toBe('saved')
  })
})
