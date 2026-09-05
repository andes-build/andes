import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readWorkspaceFile, WorkspaceFileOutsideRootError } from './workspace-file-read'

describe('readWorkspaceFile', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'andes-workspace-file-read-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('reads a file inside the root', () => {
    writeFileSync(join(root, 'backlog.md'), 'one line')
    const result = readWorkspaceFile(root, join(root, 'backlog.md'))
    expect(result.content).toBe('one line')
    expect(result.modifiedAtMs).toBeGreaterThan(0)
  })

  it('refuses a path outside the root', () => {
    const outside = mkdtempSync(join(tmpdir(), 'andes-workspace-file-read-outside-'))
    writeFileSync(join(outside, 'secret.md'), 'nope')
    try {
      expect(() => readWorkspaceFile(root, join(outside, 'secret.md'))).toThrow(
        WorkspaceFileOutsideRootError
      )
    } finally {
      rmSync(outside, { recursive: true, force: true })
    }
  })

  it('refuses a traversal path that only looks nested', () => {
    mkdirSync(join(root, 'nested'))
    expect(() => readWorkspaceFile(join(root, 'nested'), join(root, 'backlog.md'))).toThrow(
      WorkspaceFileOutsideRootError
    )
  })
})
