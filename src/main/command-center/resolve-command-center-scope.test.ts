import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveCommandCenterScope } from './resolve-command-center-scope'

describe('spec009#2 resolveCommandCenterScope', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'andes-command-center-scope-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('falls back to root when the brain has no workspace yet', () => {
    expect(resolveCommandCenterScope(tempDir)).toEqual({ type: 'root' })
  })

  it('picks the single workspace when the brain has exactly one', () => {
    mkdirSync(join(tempDir, 'workspaces', 'tandem-pay'), { recursive: true })
    expect(resolveCommandCenterScope(tempDir)).toEqual({ type: 'workspace', slug: 'tandem-pay' })
  })

  it('falls back to root rather than guessing among several workspaces', () => {
    mkdirSync(join(tempDir, 'workspaces', 'tandem-pay'), { recursive: true })
    mkdirSync(join(tempDir, 'workspaces', 'acme'), { recursive: true })
    expect(resolveCommandCenterScope(tempDir)).toEqual({ type: 'root' })
  })
})
