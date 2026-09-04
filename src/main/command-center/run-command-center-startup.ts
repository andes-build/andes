import { join } from 'node:path'
import { runProcess } from '../../shared/child-process/run-process'

const COMMAND_CENTER_STARTUP_TIMEOUT_MS = 15_000

export type CommandCenterStartupScope = { type: 'workspace'; slug: string } | { type: 'root' }

export type CommandCenterStartupRunResult =
  | { kind: 'ok'; stdout: string }
  | { kind: 'error'; stderr: string; code: number | null }
  | { kind: 'unavailable' }

/**
 * Runs the vendored core's `session-start.sh` (spec 005's vendoring, same
 * `runProcess` path as `prepareBrainStructure` — never `child_process`
 * directly) against a brain and scope, and hands back its raw stdout. The
 * Command Center's parser (`src/shared/command-center-startup-output.ts`)
 * splits that output; this function never touches its content.
 */
export async function runCommandCenterStartup(
  brainPath: string,
  corePath: string,
  scope: CommandCenterStartupScope
): Promise<CommandCenterStartupRunResult> {
  const script = join(corePath, 'lib', 'session-start.sh')
  const scopeArgs = scope.type === 'root' ? ['--root'] : ['--workspace', scope.slug]
  try {
    const result = await runProcess({
      program: 'bash',
      args: [script, '--brain', brainPath, ...scopeArgs],
      timeoutMs: COMMAND_CENTER_STARTUP_TIMEOUT_MS
    })
    if (result.code !== 0) {
      return { kind: 'error', stderr: result.stderr, code: result.code }
    }
    return { kind: 'ok', stdout: result.stdout }
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    if (nodeError.code === 'ENOENT') {
      return { kind: 'unavailable' }
    }
    throw error
  }
}
