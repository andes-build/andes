import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { WorkspaceFileTreeNode } from '../../shared/workspace-scope-types'

// Why: never show git/tooling internals or dotfiles in the Files screen tree
// (spec 010, criterion 7) — this mirrors the exclusion list `listMarkdownDocuments`
// (src/main/ipc/markdown-documents.ts) already applies for the same reason.
const EXCLUDED_DIR_NAMES = new Set(['.git', 'node_modules', '.os', '.claude'])

function compareNodes(a: WorkspaceFileTreeNode, b: WorkspaceFileTreeNode): number {
  if (a.isDirectory !== b.isDirectory) {
    return a.isDirectory ? -1 : 1
  }
  return a.name.localeCompare(b.name)
}

function readDirEntries(dirPath: string): readonly { name: string; isDirectory: () => boolean }[] {
  try {
    return readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return []
  }
}

function visit(dirPath: string, relativeBase: string): WorkspaceFileTreeNode[] {
  const nodes = readDirEntries(dirPath)
    .filter((entry) => !entry.name.startsWith('.') && !EXCLUDED_DIR_NAMES.has(entry.name))
    .map((entry): WorkspaceFileTreeNode => {
      const path = join(dirPath, entry.name)
      const relativePath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path,
          relativePath,
          isDirectory: true,
          children: visit(path, relativePath)
        }
      }
      return { name: entry.name, path, relativePath, isDirectory: false }
    })
  return nodes.sort(compareNodes)
}

/** Reads the file tree rooted at `rootPath` — a workspace's directory, or the
 *  brain root for the "My work" scope (spec 010, criterion 7). Reuses the
 *  same plain-`readdir` approach as `listMarkdownDocuments`
 *  (src/main/ipc/markdown-documents.ts) rather than opening a new way of
 *  reading files: that function returns a flat markdown-only index for quick
 *  open, this one returns a nested tree of every file for a browsing panel —
 *  different shape for a different surface, same primitive underneath. */
export function readWorkspaceFileTree(rootPath: string): WorkspaceFileTreeNode[] {
  return visit(rootPath, '')
}
