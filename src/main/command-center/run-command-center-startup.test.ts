import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { prepareBrainStructure } from '../onboarding/brain-preparation'
import { createFirstWorkspace } from '../onboarding/workspace-creation'
import { runCommandCenterStartup } from './run-command-center-startup'

const CORE_PATH = join(__dirname, '..', '..', '..', 'vendor', 'ai-first-os-core', 'core')

describe('spec009#2 runCommandCenterStartup', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'andes-command-center-startup-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('runs the vendored core scan against the root of a prepared brain', async () => {
    const brainPath = join(tempDir, 'my-brain')
    await prepareBrainStructure(brainPath, CORE_PATH)

    const result = await runCommandCenterStartup(brainPath, CORE_PATH, { type: 'root' })

    expect(result.kind).toBe('ok')
    if (result.kind !== 'ok') {
      throw new Error('expected ok')
    }
    expect(result.stdout).toContain('Waiting for your decision')
    expect(result.stdout).toContain('In progress')
    expect(result.stdout).toContain('Queued')
    expect(result.stdout).toContain('Checks')
    expect(result.stdout).toMatch(/\d+ nodes · /)
  })

  it('runs the scan against a workspace slug the brain actually has', async () => {
    const brainPath = join(tempDir, 'my-brain')
    await prepareBrainStructure(brainPath, CORE_PATH)
    await createFirstWorkspace(brainPath, CORE_PATH, 'Tandem Pay')

    const result = await runCommandCenterStartup(brainPath, CORE_PATH, {
      type: 'workspace',
      slug: 'tandem-pay'
    })

    expect(result.kind).toBe('ok')
  })

  it('reports an error result — never throws — for a workspace slug that does not exist', async () => {
    const brainPath = join(tempDir, 'my-brain')
    await prepareBrainStructure(brainPath, CORE_PATH)

    const result = await runCommandCenterStartup(brainPath, CORE_PATH, {
      type: 'workspace',
      slug: 'does-not-exist'
    })

    expect(result.kind).toBe('error')
    if (result.kind !== 'error') {
      throw new Error('expected error')
    }
    expect(result.code).toBe(2)
  })
})
