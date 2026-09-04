/** Which scope of the brain the Command Center's startup scan covers — a
 *  workspace slug, or the brain's own root ("My work"). Mirrors
 *  `session-start.sh --workspace`/`--root` (spec 009's estado previo). */
export type CommandCenterScope = { type: 'workspace'; slug: string } | { type: 'root' }

export type CommandCenterRunStartupArgs = {
  brainPath: string
  /** Which scope the scan covers. Comes from the simple-mode workspace
   *  selector (spec 010), never guessed on the main side: the selector is
   *  the one place the operator chooses a scope, and every simple-mode
   *  surface reads it (`store/slices/workspace-scope.ts`). */
  scope: CommandCenterScope
}

export type CommandCenterRunStartupResult =
  | { kind: 'ok'; stdout: string }
  | { kind: 'error'; stderr: string; code: number | null }
  | { kind: 'unavailable' }
  /** The folder is missing the core structure (`.os/core`) — spec 009's
   *  "carpeta sin preparar" uncomfortable state, checked before the scan runs
   *  rather than parsed out of the script's stderr. */
  | { kind: 'not-prepared' }
