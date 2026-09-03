import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { userInfo } from 'node:os'
import { runProcess } from '../../shared/child-process/run-process'

export class WorkspaceCreationFailedError extends Error {
  constructor(stderr: string) {
    super(`Could not create the workspace: ${stderr.trim() || 'unknown error'}`)
    this.name = 'WorkspaceCreationFailedError'
  }
}

/** Same rule as `core/lib/common.sh`'s `os_slugify`: lowercase, accents
 *  stripped, everything else collapsed to single dashes, trimmed. Computed
 *  here (not parsed from the script's stdout) so the caller knows the
 *  resulting folder path deterministically. */
export function slugifyWorkspaceName(name: string): string {
  const deaccented = name.normalize('NFD').replace(/[̀-ͯ]/g, '')
  return deaccented
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type WorkspaceCreationResult = {
  /** Path to the new workspace folder, relative to `folderPath`. */
  workspaceRelativePath: string
}

/**
 * Creates "Tu primer workspace" (spec 005 ajuste del 2026-09-03, 📌 Peter):
 * runs the vendored core's `new-workspace.sh` (writes the head file — "qué
 * es" — and `resolver.md`, and registers the workspace height in
 * `tree.md`), then scaffolds the three node files that script does not
 * write on its own — `decisions.md` ("decisiones"), `learnings.md`
 * ("aprendizajes"), `backlog.md` ("pendientes") — each with a one-line
 * header so they exist as real, if empty, files. `initiatives/` ("iniciativas")
 * is created empty by the script itself.
 */
export async function createFirstWorkspace(
  folderPath: string,
  corePath: string,
  name: string
): Promise<WorkspaceCreationResult> {
  const slug = slugifyWorkspaceName(name)
  if (slug.length === 0) {
    throw new Error('A workspace name is required.')
  }
  const script = join(corePath, 'lib', 'new-workspace.sh')
  const owner = userInfo().username || 'owner'
  const result = await runProcess({
    program: 'bash',
    args: [
      script,
      '--brain',
      folderPath,
      '--name',
      name,
      '--slug',
      slug,
      '--role',
      '',
      '--owner',
      owner
    ],
    timeoutMs: 30_000
  })
  if (result.code !== 0) {
    throw new WorkspaceCreationFailedError(result.stderr)
  }
  const workspaceDir = join(folderPath, 'workspaces', slug)
  for (const [fileName, header] of [
    ['decisions.md', `# ${name} — Decisiones\n`],
    ['learnings.md', `# ${name} — Aprendizajes\n`],
    ['backlog.md', `# ${name} — Pendientes\n`]
  ] as const) {
    const filePath = join(workspaceDir, fileName)
    if (!existsSync(filePath)) {
      mkdirSync(workspaceDir, { recursive: true })
      writeFileSync(filePath, header)
    }
  }
  return { workspaceRelativePath: join('workspaces', slug) }
}
