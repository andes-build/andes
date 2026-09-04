import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { listWorkspaceScopes } from './workspace-scope-discovery'

describe('listWorkspaceScopes', () => {
  let folderPath: string

  beforeEach(() => {
    folderPath = mkdtempSync(join(tmpdir(), 'andes-workspace-scope-'))
  })

  afterEach(() => {
    rmSync(folderPath, { recursive: true, force: true })
  })

  it('returns [] when the folder has no workspaces/ directory (criterion 2)', () => {
    expect(listWorkspaceScopes(folderPath)).toEqual([])
  })

  it('lists workspaces named from their head file, README.md or context.md, and falls back to the slug', () => {
    const workspacesDir = join(folderPath, 'workspaces')
    mkdirSync(join(workspacesDir, 'tandem-pay'), { recursive: true })
    writeFileSync(
      join(workspacesDir, 'tandem-pay', 'README.md'),
      '---\nrole: cpo\n---\n\n# Tandem Pay\n\nWhat it is.\n'
    )
    mkdirSync(join(workspacesDir, 'old-form-ws'), { recursive: true })
    writeFileSync(join(workspacesDir, 'old-form-ws', 'context.md'), '# Old Form Workspace\n')
    mkdirSync(join(workspacesDir, 'no-head-file'), { recursive: true })
    // A non-directory entry under workspaces/ must never be listed as a scope.
    writeFileSync(join(workspacesDir, 'README.md'), 'not a workspace')

    const result = listWorkspaceScopes(folderPath)

    expect(result).toEqual([
      { slug: 'no-head-file', name: 'No Head File', path: join(workspacesDir, 'no-head-file') },
      {
        slug: 'old-form-ws',
        name: 'Old Form Workspace',
        path: join(workspacesDir, 'old-form-ws')
      },
      { slug: 'tandem-pay', name: 'Tandem Pay', path: join(workspacesDir, 'tandem-pay') }
    ])
  })
})
