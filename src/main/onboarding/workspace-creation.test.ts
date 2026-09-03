import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => process.cwd() }
}))

import { prepareBrainStructure, hasExistingWorkspaces } from './brain-preparation'
import { createFirstWorkspace, slugifyWorkspaceName } from './workspace-creation'

const CORE_PATH = join(__dirname, '..', '..', '..', 'vendor', 'ai-first-os-core', 'core')

describe('ajuste 2026-09-03 (📌 Peter) — Tu primer workspace', () => {
  let tempDir: string
  let folderPath: string

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'andes-workspace-'))
    folderPath = join(tempDir, 'my-folder')
    await prepareBrainStructure(folderPath, CORE_PATH)
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('slugifies a workspace name the same way the core does', () => {
    expect(slugifyWorkspaceName('Marketing Team')).toBe('marketing-team')
    expect(slugifyWorkspaceName('Café con leche')).toBe('cafe-con-leche')
  })

  it('creates the workspace with its head file, resolver, and initiatives folder', async () => {
    expect(hasExistingWorkspaces(folderPath)).toBe(false)

    const result = await createFirstWorkspace(folderPath, CORE_PATH, 'My Workspace')

    expect(result.workspaceRelativePath).toBe(join('workspaces', 'my-workspace'))
    const workspaceDir = join(folderPath, 'workspaces', 'my-workspace')
    expect(existsSync(join(workspaceDir, 'README.md'))).toBe(true)
    expect(existsSync(join(workspaceDir, 'resolver.md'))).toBe(true)
    expect(existsSync(join(workspaceDir, 'initiatives'))).toBe(true)
    expect(existsSync(join(workspaceDir, 'decisions.md'))).toBe(true)
    expect(existsSync(join(workspaceDir, 'learnings.md'))).toBe(true)
    expect(existsSync(join(workspaceDir, 'backlog.md'))).toBe(true)
    expect(readFileSync(join(workspaceDir, 'decisions.md'), 'utf8')).toContain('My Workspace')

    expect(hasExistingWorkspaces(folderPath)).toBe(true)
  })
})
