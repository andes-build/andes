import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import { runProcess } from '../../shared/child-process/run-process'

const PREPARE_BRAIN_TIMEOUT_MS = 30_000

// Why: these three markers are what `core/install.sh` writes into a brain
// (see vendor/ai-first-os-core/core/install.sh) — a symlinked `.os/core`,
// the `CLAUDE.md` symlink to the product's session contract, and at least
// one linked agent under `.claude/agents/`. Checking for them before running
// the installer is how this step tells "already prepared" from "first run"
// without parsing the installer's own (Spanish-only) stdout.
const STRUCTURE_MARKERS = ['.os/core', 'CLAUDE.md', '.claude/agents'] as const

export type BrainPreparationResult = {
  /** True when the brain already had the full structure before this run. */
  alreadyPrepared: boolean
  /** Paths (relative to the brain) the installer added. Empty when `alreadyPrepared`. */
  added: string[]
}

export class BrainPreparationUnavailableError extends Error {
  constructor(cause: unknown) {
    super('Could not run the core installer: bash is not available on this machine.')
    this.name = 'BrainPreparationUnavailableError'
    this.cause = cause
  }
}

export class BrainPreparationFailedError extends Error {
  constructor(stderr: string) {
    super(`The core installer failed: ${stderr.trim() || 'unknown error'}`)
    this.name = 'BrainPreparationFailedError'
  }
}

function hasStructure(brainPath: string): boolean {
  return STRUCTURE_MARKERS.every((marker) => existsSync(join(brainPath, marker)))
}

/** Resolves the vendored core (spec 005, criterion 5) — packaged under
 *  `resources/vendor/ai-first-os-core` via extraResources, or read straight
 *  from the repo's own `vendor/` in dev. Never touches the network or git. */
export function resolveVendoredCorePath(): string {
  const base = app.isPackaged
    ? join(process.resourcesPath, 'vendor', 'ai-first-os-core')
    : join(app.getAppPath(), 'vendor', 'ai-first-os-core')
  return join(base, 'core')
}

/**
 * Prepares a folder as an Andes brain by running the vendored core's
 * `install.sh` against it. Idempotent — running it twice on an already
 * prepared brain changes nothing (the installer itself guarantees that).
 * `corePath` is an explicit parameter (never resolved internally via
 * Electron's `app`) so this function runs in a plain Node unit test.
 */
export async function prepareBrainStructure(
  brainPath: string,
  corePath: string
): Promise<BrainPreparationResult> {
  mkdirSync(brainPath, { recursive: true })
  const alreadyPrepared = hasStructure(brainPath)
  const installScript = join(corePath, 'install.sh')
  let result: Awaited<ReturnType<typeof runProcess>>
  try {
    result = await runProcess({
      program: 'bash',
      args: [installScript, brainPath],
      timeoutMs: PREPARE_BRAIN_TIMEOUT_MS
    })
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    if (nodeError.code === 'ENOENT') {
      throw new BrainPreparationUnavailableError(error)
    }
    throw error
  }
  if (result.code !== 0) {
    throw new BrainPreparationFailedError(result.stderr)
  }
  return {
    alreadyPrepared,
    added: alreadyPrepared
      ? []
      : STRUCTURE_MARKERS.filter((marker) => existsSync(join(brainPath, marker)))
  }
}

// Why: `workspaces/` and `orgs/` are the two layouts `install.sh`'s
// `os_ws_dir` recognizes — the "Tu primer workspace" step (spec 005) skips
// itself when either already holds a workspace, per the ajuste del
// 2026-09-03 (📌 Peter).
const WORKSPACE_DIR_NAMES = ['workspaces', 'orgs'] as const

/** True when the folder already has at least one workspace under
 *  `workspaces/` or `orgs/`. */
export function hasExistingWorkspaces(folderPath: string): boolean {
  return listWorkspaceSlugs(folderPath).length > 0
}

/** The folder's workspace slugs — the subdirectory names under whichever of
 *  `workspaces/`/`orgs/` exists (checked in that order, same as
 *  `WORKSPACE_DIR_NAMES`; a brain with `orgs/` but no `workspaces/` is the
 *  older layout). Used by the Command Center (spec 009) to pick a scope when
 *  there is no workspace selector yet. */
export function listWorkspaceSlugs(folderPath: string): string[] {
  for (const dirName of WORKSPACE_DIR_NAMES) {
    const dirPath = join(folderPath, dirName)
    if (!existsSync(dirPath)) {
      continue
    }
    try {
      const slugs = readdirSync(dirPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
      if (slugs.length > 0) {
        return slugs
      }
    } catch {
      continue
    }
  }
  return []
}
