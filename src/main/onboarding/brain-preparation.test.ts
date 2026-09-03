import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => process.cwd() }
}))

import { prepareBrainStructure } from './brain-preparation'

const CORE_PATH = join(__dirname, '..', '..', '..', 'vendor', 'ai-first-os-core', 'core')

describe('spec005#5 prepareBrainStructure', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'andes-brain-prep-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('creates the structure from the vendored core in an empty folder', async () => {
    const brainPath = join(tempDir, 'my-brain')
    const result = await prepareBrainStructure(brainPath, CORE_PATH)

    expect(result.alreadyPrepared).toBe(false)
    expect(result.added.sort()).toEqual(['.claude/agents', '.os/core', 'CLAUDE.md'].sort())
    expect(existsSync(join(brainPath, '.os', 'core'))).toBe(true)
    expect(existsSync(join(brainPath, 'CLAUDE.md'))).toBe(true)
  })

  it('reports no changes on a folder that already has the structure', async () => {
    const brainPath = join(tempDir, 'my-brain')
    await prepareBrainStructure(brainPath, CORE_PATH)

    const second = await prepareBrainStructure(brainPath, CORE_PATH)

    expect(second.alreadyPrepared).toBe(true)
    expect(second.added).toEqual([])
  })

  it('never requires a git repository at the brain path', async () => {
    const brainPath = join(tempDir, 'plain-folder')
    await prepareBrainStructure(brainPath, CORE_PATH)

    expect(existsSync(join(brainPath, '.git'))).toBe(false)
  })
})
