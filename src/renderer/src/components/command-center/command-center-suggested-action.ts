import type { CommandCenterStartupOutput } from '../../../../shared/command-center-startup-output'
import {
  buildCheckFindingMessage,
  buildWaitingResolveMessage
} from './command-center-first-message'

export type CommandCenterSuggestedAction = {
  /** The single line shown above the cards. */
  text: string
  /** The first message an "Open thread" click sends. */
  message: string
}

/**
 * Andes has no live agent narrating "what to do next" the way an interactive
 * session does (peter-os's own session contract writes that line itself,
 * from inside a conversation) — the Command Center is a headless scan, so
 * this derives the same idea mechanically from the parsed sections: the
 * first thing actually waiting on the operator, or failing that the first
 * check finding. `null` means genuinely nothing to suggest.
 */
export function deriveSuggestedAction(
  output: CommandCenterStartupOutput
): CommandCenterSuggestedAction | null {
  const firstWaiting = output.waiting.rows[0]
  if (firstWaiting) {
    return { text: firstWaiting, message: buildWaitingResolveMessage(firstWaiting) }
  }
  // Why: checks.rows[0] is always the identity/resolver bookkeeping row
  // session-start.sh prints unconditionally, and "no findings" is its literal
  // empty marker when nothing else was found — neither is a real finding
  // worth a suggested thread.
  const firstCheck = output.checks.rows.find(
    (row) => !/^identity \d+\/\d+/.test(row) && row !== 'no findings'
  )
  if (firstCheck) {
    return { text: firstCheck, message: buildCheckFindingMessage(firstCheck) }
  }
  return null
}
