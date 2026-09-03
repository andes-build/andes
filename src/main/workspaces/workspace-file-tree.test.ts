import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readWorkspaceFileTree } from './workspace-file-tree'

describe('readWorkspaceFileTree', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'andes-workspace-file-tree-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('builds a nested tree, directories first then files alphabetically, excluding dotfiles and git/tooling internals', () => {
    writeFileSync(join(root, 'README.md'), '# Root')
    writeFileSync(join(root, 'backlog.md'), 'backlog')
    mkdirSync(join(root, 'initiatives'))
    writeFileSync(join(root, 'initiatives', 'migracion-kyc.md'), 'kyc')
    mkdirSync(join(root, '.git'))
    writeFileSync(join(root, '.git', 'HEAD'), 'ref: refs/heads/main')
    mkdirSync(join(root, 'node_modules'))
    writeFileSync(join(root, '.DS_Store'), '')

    const tree = readWorkspaceFileTree(root)

    expect(tree).toEqual([
      {
        name: 'initiatives',
        path: join(root, 'initiatives'),
        relativePath: 'initiatives',
        isDirectory: true,
        children: [
          {
            name: 'migracion-kyc.md',
            path: join(root, 'initiatives', 'migracion-kyc.md'),
            relativePath: 'initiatives/migracion-kyc.md',
            isDirectory: false
          }
        ]
      },
      {
        name: 'backlog.md',
        path: join(root, 'backlog.md'),
        relativePath: 'backlog.md',
        isDirectory: false
      },
      {
        name: 'README.md',
        path: join(root, 'README.md'),
        relativePath: 'README.md',
        isDirectory: false
      }
    ])
  })

  it('returns [] for a path that does not exist', () => {
    expect(readWorkspaceFileTree(join(root, 'missing'))).toEqual([])
  })
})
