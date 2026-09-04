import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { WorkspaceScopeSummary } from '../../shared/workspace-scope-types'

// Why: these are the two head-file names a workspace node can have (spec 010
// delegated decision — see vendor/ai-first-os-core/core/lib/common.sh
// `os_head_file`: `README.md` is the current form, `context.md` the one a
// brain created before the spec 040 rename keeps using). Reading `tree.md`
// to resolve this exactly per-brain is out of scope here; trying both
// candidates in order is enough to name a workspace without guessing.
const HEAD_FILE_CANDIDATES = ['README.md', 'context.md'] as const

function stripFrontmatter(content: string): string {
  if (!content.startsWith('---')) {
    return content
  }
  const end = content.indexOf('\n---', 3)
  return end === -1 ? content : content.slice(end + 4)
}

function firstHeadingFrom(content: string): string | null {
  const body = stripFrontmatter(content)
  for (const line of body.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('# ')) {
      return trimmed.slice(2).trim()
    }
  }
  return null
}

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function readWorkspaceDisplayName(workspaceDir: string, slug: string): string {
  for (const headFileName of HEAD_FILE_CANDIDATES) {
    const headPath = join(workspaceDir, headFileName)
    if (!existsSync(headPath)) {
      continue
    }
    try {
      const heading = firstHeadingFrom(readFileSync(headPath, 'utf8'))
      if (heading) {
        return heading
      }
    } catch {
      // Unreadable head file: fall through to the next candidate, then to the slug.
    }
  }
  return humanizeSlug(slug)
}

/** Lists the workspaces of an opened folder (spec 010, criterion 2): the
 *  subdirectories of `workspaces/`, each named for display by its head
 *  file's first heading. Returns `[]` when the folder has no `workspaces/`
 *  directory yet — the only scope then is the root ("My work"), decided by
 *  the caller. Never reads the rest of the folder's tree. */
export function listWorkspaceScopes(folderPath: string): WorkspaceScopeSummary[] {
  const workspacesDir = join(folderPath, 'workspaces')
  if (!existsSync(workspacesDir)) {
    return []
  }
  let entries: readonly { name: string; isDirectory: () => boolean }[]
  try {
    entries = readdirSync(workspacesDir, { withFileTypes: true })
  } catch {
    return []
  }
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => {
      const path = join(workspacesDir, entry.name)
      return {
        slug: entry.name,
        name: readWorkspaceDisplayName(path, entry.name),
        path
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
